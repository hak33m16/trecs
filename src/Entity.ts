import { Component } from "./Component";
import { EntityManager } from "./EntityManager";

export interface TypeStore<T> extends Function {
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

  public component<T extends Component>(classRef: TypeStore<T>): T | undefined {
    return this._componentMap[classRef.name] as T;
  }

  // TODO: Figure out why this is accepting any type, not
  // just those that extend Component
  public addComponents = (...classRefs: TypeStore<Component>[]) => {
    this.assertManagerExists();
    classRefs.forEach((clazz) => {
      this._manager!.entityAddComponent(this, new clazz());
    });

    return this;
  };

  public removeComponent<T extends Component>(classRef: TypeStore<T>) {
    this.assertManagerExists();
    this._manager!.entityRemoveComponent(this, classRef);
  }

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
