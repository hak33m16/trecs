import { Component } from "./Component";
import { EntityManager } from "./EntityManager";

interface TypeStore<T> extends Function {
  new (...args: any[]): T;
}

export interface ComponentMap {
  [name: string]: Component;
}

export class Entity {
  static nextId: number = 0;

  public id: number;

  /* Internal fields */

  public _manager: EntityManager | null;
  public _tags: string[];
  public _componentMap: ComponentMap;

  constructor(manager: EntityManager | null = null) {
    this.id = Entity.nextId++;
    this._manager = manager;
    this._tags = [];
    this._componentMap = {};
  }

  public component<T extends Component>(classRef: TypeStore<T>): T | undefined {
    return this._componentMap[classRef.name] as T;
  }

  public addComponent = (component: Component) => {
    this.assertManagerExists();
    this._manager!.entityAddComponent(this, component);

    return this;
  };

  public removeComponent = (component: Component) => {
    this.assertManagerExists();
    this._manager!.entityRemoveComponent(this, component);
  };

  public removeAllComponents = () => {
    this.assertManagerExists();
    this._manager!.entityRemoveAllComponents(this);
  };

  public hasAllComponents = (...componentClasses: Function[]) => {
    let hasAllComponents = true;

    for (const clazz of componentClasses) {
      hasAllComponents = hasAllComponents && this.hasComponent(clazz);
    }

    return hasAllComponents;
  };

  public hasComponent = (componentClass: Function) => {
    return this._componentMap[componentClass.name] !== undefined;
  };

  public hasTag = (tag: string) => {
    return this._tags.indexOf(tag) !== -1;
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
