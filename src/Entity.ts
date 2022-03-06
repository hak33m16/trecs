import { Component } from "./Component";
import { EntityManager } from "./EntityManager";

export interface ComponentTypeStore<T> extends Function {
  __uniqueComponentProperty: any;
  new (...args: any[]): T;
}

export interface ComponentMap {
  [name: string]: Component;
}

export type EntityID = number;

export class Entity {
  static nextId: number = 0;

  public id: EntityID;

  /* Internal fields */

  public _manager: EntityManager | null;
  public _tags: Set<string>;
  public _componentMap: ComponentMap;

  constructor(manager: EntityManager) {
    this.id = Entity.nextId++;
    this._manager = manager;
    this._tags = new Set();
    this._componentMap = {};
  }

  /**
   * Helper function to safely access components as it is guaranteed
   * to return a component of the specified type.
   *
   * If the specified component type doesn't exist on the entity, it
   * will auto-construct it and add it.
   * @param classRef type of component
   * @returns component of specified type
   */
  public component<T extends Component>(classRef: ComponentTypeStore<T>): T {
    if (!this.hasComponent(classRef)) {
      return this.addComponent(classRef);
    }
    return this._componentMap[classRef.name] as T;
  }

  public getComponent<T extends Component>(
    classRef: ComponentTypeStore<T>
  ): T | undefined {
    return this._componentMap[classRef.name] as T;
  }

  public addComponent<T extends Component>(classRef: ComponentTypeStore<T>): T {
    this.assertManagerExists();
    const component = new classRef();
    this._manager!.entityAddComponent(this, component);
    return component;
  }

  public addComponents = (
    ...classRefs: ComponentTypeStore<Component>[]
  ): Entity => {
    this.assertManagerExists();
    classRefs.forEach((clazz) => {
      this._manager!.entityAddComponent(this, new clazz());
    });

    return this;
  };

  public removeComponent<T extends Component>(classRef: ComponentTypeStore<T>) {
    this.assertManagerExists();
    this._manager!.entityRemoveComponent(this, classRef);
  }

  public removeAllComponents = () => {
    this.assertManagerExists();
    this._manager!.entityRemoveAllComponents(this);
  };

  public hasAllComponents<T extends Component>(
    ...classRefs: ComponentTypeStore<T>[]
  ) {
    let hasAllComponents = true;

    for (const clazz of classRefs) {
      hasAllComponents = hasAllComponents && this.hasComponent(clazz);
    }

    return hasAllComponents;
  }

  public hasComponent<T extends Component>(
    classRef: ComponentTypeStore<T>
  ): boolean {
    return this._componentMap[classRef.name] !== undefined;
  }

  public hasTag = (tag: string) => {
    return this._tags.has(tag);
  };

  public addTag = (tag: string) => {
    this.assertManagerExists();
    this._manager!.entityAddTag(this, tag);

    return this;
  };

  public removeTag = (tag: string) => {
    this.assertManagerExists();
    this._manager!.entityRemoveTag(this, tag);

    return this;
  };

  public remove = () => {
    this.assertManagerExists();
    this._manager!.removeEntity(this);
  };

  private assertManagerExists = () => {
    if (this._manager === null || this._manager === undefined) {
      throw new Error("Can't perform actions on Entity with no EntityManager");
    }
  };
}
