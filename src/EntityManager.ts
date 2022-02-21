import { Component } from "./Component";
import { Entity } from "./Entity";

interface TagPool {
  [tag: string]: Entity[];
}

interface GroupPool {
  [name: string]: Group;
}

export class EntityManager {
  private tags: TagPool;
  private entities: Entity[];
  private groups: GroupPool;
  // private entityPool: any;
  private groupKeyMap: WeakMap<Function[], string>;

  constructor() {
    this.tags = {};
    this.entities = [];
    this.groups = {};
    // this.entityPool = {};
    this.groupKeyMap = new WeakMap();
  }

  public createEntity = (): Entity => {
    // TODO: Copy over the entity pool idea. Prolly useful
    // for not creating tons of new objects
    const entity = new Entity(this);
    this.entities.push(entity);

    return entity;
  };

  public removeEntitiesByTag = (tag: string): void => {
    const taggedEntities = this.tags[tag];

    if (!taggedEntities) {
      return;
    }

    // TODO: Make sure that doing this forward instead
    // of backwards is ok?
    for (const entity of taggedEntities) {
      entity.remove();
    }
  };

  public removeAllEntities = () => {
    for (const entity of this.entities) {
      entity.remove();
    }
  };

  public removeEntity = (entity: Entity): void => {
    const index = this.entities.indexOf(entity);

    if (index === -1) {
      throw new Error("Tried to remove entity not in list");
    }

    this.entityRemoveAllComponents(entity);

    this.entities.splice(index, 1);

    for (const tag in this.tags) {
      const taggedEntities = this.tags[tag];
      const entityTagIndex = taggedEntities.indexOf(entity);
      if (entityTagIndex !== -1) {
        taggedEntities.splice(entityTagIndex, 1);
      }
    }

    entity._manager = null;
    // TODO: figure out wtf this pool is
    //this.entityPool.recycle(entity)
    //entity.removeAllListeners()
  };

  public entityAddTag = (entity: Entity, tag: string) => {
    const taggedEntities = this.tags[tag];

    if (!taggedEntities) {
      // Hmmm, is our taggedEntities pointing to this same reference...?
      this.tags[tag] = [];
    }

    if (taggedEntities.indexOf(entity) !== -1) return;

    taggedEntities.push(entity);
    entity._tags.push(tag);
  };

  public entityRemoveTag = (entity: Entity, tag: string) => {
    const taggedEntities = this.tags[tag];
    if (!taggedEntities) return;

    const index = taggedEntities.indexOf(entity);
    if (index === -1) return;

    taggedEntities.splice(index, 1);
    entity._tags.splice(entity._tags.indexOf(tag), 1);
  };

  public entityAddComponent = (entity: Entity, component: Component) => {
    // If this entity already has this component we're returning,
    // but shouldn't we throw an error...? Could be misleading
    if (entity._components.includes(component)) return;

    entity._components.push(component);

    const componentName = component.constructor.name;
    entity._componentMap[componentName] = component;

    for (const groupName in this.groups) {
      const group = this.groups[groupName];

      // Only add this entity to a group index if this component is in the group,
      // this entity has all the components of the group, and its not already in
      // the index.
      if (!group.componentClasses.includes(component.constructor)) {
        continue;
      }
      if (!entity.hasAllComponents(group.componentClasses)) {
        continue;
      }
      // TODO: Calls like this seem really inefficient. Why aren't we using
      // a hashmap to store entity IDs in groups? Could be getting instant
      // access for each group. Currently, if groups = g, and entities = e
      // our access time is O(g*e), could be O(g + e)
      if (group.entities.includes(entity)) {
        continue;
      }

      group.entities.push(entity);
    }

    //entity.emit('component added', Component)
  };

  public entityRemoveAllComponents = (entity: Entity): void => {
    const components = entity._components;

    components.forEach((c) => {
      entity.removeComponent(c);
    });
  };

  public entityRemoveComponent = (entity: Entity, component: Component) => {
    const index = entity._components.indexOf(component);
    if (index === -1) return;

    // entity.emit('component removed', component)
    for (const groupName in this.groups) {
      const group = this.groups[groupName];

      // TODO: Double check that component.constructor is what we want to store here
      if (group.componentClasses.indexOf(component.constructor) === -1) {
        continue;
      }
      if (!entity.hasAllComponents(group.componentClasses)) {
        continue;
      }

      const location = group.entities.indexOf(entity);
      if (location !== -1) {
        group.entities.splice(location, 1);
      }
    }

    const className = component.constructor.name;
    entity._components.splice(index, 1);
    delete entity._componentMap[className];
  };

  public queryComponents = (componentClasses: Function[]) => {
    const group =
      this.groups[this.groupKey(componentClasses)] ??
      this.indexGroup(componentClasses);

    return group.entities;
  };

  public count = () => this.entities.length;

  private indexGroup = (componentClasses: Function[]) => {
    const key = this.groupKey(componentClasses);

    if (this.groups[key]) return;

    const group = (this.groups[key] = new Group(componentClasses));

    for (const entity of this.entities) {
      if (entity.hasAllComponents(componentClasses)) {
        group.entities.push(entity);
      }
    }
  };

  private groupKey = (componentClasses: Function[]) => {
    const cachedKey = this.groupKeyMap.get(componentClasses);
    if (cachedKey) {
      return cachedKey;
    }

    const names: string[] = [];
    for (const entry of componentClasses) {
      names.push(entry.name);
    }

    const key = names
      .map((n) => n.toLowerCase())
      .sort()
      .join("-");
    this.groupKeyMap.set(componentClasses, key);

    return key;
  };
}

export class Group {
  public componentClasses: Function[];
  public entities: Entity[];

  constructor(componentClasses: Function[] = [], entities: Entity[] = []) {
    this.componentClasses = componentClasses;
    this.entities = entities;
  }
}
