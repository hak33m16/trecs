import { Component } from "./Component";
import { EntityManager } from "./EntityManager";

export interface ComponentMap {
  [name: string]: Component;
}

export class Entity {
  static nextId: number = 0;

  public id: number;

  // Internal fields

  public _manager: EntityManager | null;
  public _components: Component[];
  public _tags: string[];
  public _componentMap: ComponentMap;

  constructor(manager: EntityManager | null = null) {
    this.id = Entity.nextId++;
    this._manager = manager;
    this._components = [];
    this._tags = [];
    this._componentMap = {};
  }

  public component = (classRef: Function) => {
    return this._componentMap[classRef.name];
  };

  public addComponent = (component: Component) => {
    if (this._manager === null || this._manager === undefined) {
      throw new Error("Can't perform actions on Entity with no EntityManager");
    }
    this._manager.entityAddComponent(this, component);

    return this;
  };

  public removeComponent = (component: Component) => {
    if (this._manager === null || this._manager === undefined) {
      throw new Error("Can't perform actions on Entity with no EntityManager");
    }
    this._manager.entityRemoveComponent(this, component);
  };

  public removeAllComponents = () => {
    if (this._manager === null || this._manager === undefined) {
      throw new Error("Can't perform actions on Entity with no EntityManager");
    }
    this._manager.entityRemoveAllComponents(this);
  };

  public hasAllComponents = (componentClasses: Function[]) => {
    let hasAllComponents = true;

    // TODO: This seems really bad O(n^2), we should prolly
    // be storing components by class name under the hood here
    componentClasses.forEach((componentClass) => {
      hasAllComponents = hasAllComponents && this.hasComponent(componentClass);
    });

    return hasAllComponents;
  };

  public hasComponent = (componentClass: Function) => {
    for (const component of this._components) {
      if (component instanceof componentClass) {
        return true;
      }
    }

    return false;
  };

  public hasTag = (tag: string) => {
    return this._tags.indexOf(tag) !== -1;
  };

  public addTag = (tag: string) => {
    if (this._manager === null || this._manager === undefined) {
      throw new Error("Can't perform actions on Entity with no EntityManager");
    }
    this._manager.entityAddTag(this, tag);

    return this;
  };

  public removeTag = (tag: string) => {
    if (this._manager === null || this._manager === undefined) {
      throw new Error("Can't perform actions on Entity with no EntityManager");
    }
    this._manager.entityRemoveTag(this, tag);

    return this;
  };

  public remove = () => {
    if (this._manager === null || this._manager === undefined) {
      throw new Error("Can't perform actions on Entity with no EntityManager");
    }
    this._manager.removeEntity(this);
  };
}
