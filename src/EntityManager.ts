import { Component } from "./Component";
import { Entity, EntityID, TypeStore } from "./Entity";

interface TagPool {
  [tag: string]: Map<EntityID, Entity>;
}

export class EntityManager {
  private tags: TagPool;
  private entities: Map<EntityID, Entity>;
  private groups: Map<string, Group>;
  // private entityPool: any;
  private groupKeyMap: WeakMap<Function[], string>;

  constructor() {
    this.tags = {};
    this.entities = new Map();
    this.groups = new Map();
    // this.entityPool = {};
    this.groupKeyMap = new WeakMap();
  }

  public createEntity = (): Entity => {
    // TODO: Copy over the entity pool idea. Prolly useful
    // for not creating tons of new objects
    const entity = new Entity(this);
    this.entities.set(entity.id, entity);

    return entity;
  };

  public removeEntitiesByTag = (tag: string): void => {
    const taggedEntities = this.tags[tag];
    if (!taggedEntities) return;

    taggedEntities.forEach((entity) => {
      entity.remove();
    });
  };

  public removeAllEntities = () => {
    this.entities.forEach((entity) => {
      entity.remove();
    });
  };

  public removeEntity = (entity: Entity): void => {
    if (!this.entities.has(entity.id)) {
      throw new Error("Tried to remove entity not in list");
    }

    this.entityRemoveAllComponents(entity);
    this.entities.delete(entity.id);

    for (const tag in this.tags) {
      const taggedEntities = this.tags[tag];
      taggedEntities.delete(entity.id);
    }

    entity._manager = null;
    entity._tags.clear();
    // TODO: Reuse the pool idea later on
    //this.entityPool.recycle(entity)
    //entity.removeAllListeners()
  };

  public entityAddTag = (entity: Entity, tag: string) => {
    if (!this.tags[tag]) {
      this.tags[tag] = new Map();
    }
    const taggedEntities = this.tags[tag];

    // Entity is already tagged
    if (taggedEntities.has(entity.id)) return;

    taggedEntities.set(entity.id, entity);
    entity._tags.add(tag);
  };

  public entityRemoveTag = (entity: Entity, tag: string) => {
    const taggedEntities = this.tags[tag];
    if (!taggedEntities) return;

    // Entity does not have this tag
    if (!taggedEntities.has(entity.id)) return;

    // Remove it from our tag map
    taggedEntities.delete(entity.id);
    // Remove the tag reference on the entity
    entity._tags.delete(tag);
  };

  public queryTag = (tag: string) => {
    return this.tags[tag];
  };

  public entityAddComponent = (entity: Entity, component: Component) => {
    // If this entity already has this component we're returning,
    // but shouldn't we throw an error...? Could be misleading
    if (entity._componentMap[component.constructor.name]) return;

    entity._componentMap[component.constructor.name] = component;

    const componentName = component.constructor.name;
    entity._componentMap[componentName] = component;

    this.groups.forEach((group) => {
      // Only add this entity to a group index if this component is in the group,
      // this entity has all the components of the group, and its not already in
      // the index.
      const componentIsInGroup = group.componentClasses.includes(
        component.constructor
      );
      const entityHasAllComponents = entity.hasAllComponents(
        ...group.componentClasses
      );
      const entityNotInGroup = !group.entities.has(entity.id);

      if (componentIsInGroup && entityHasAllComponents && entityNotInGroup) {
        group.entities.set(entity.id, entity);
      }
    });

    //entity.emit('component added', Component)
  };

  public entityRemoveAllComponents = (entity: Entity): void => {
    const components = entity._componentMap;

    Object.keys(components).forEach((componentName) => {
      delete components[componentName];
    });
  };

  public entityRemoveComponent<T extends Component>(
    entity: Entity,
    classRef: TypeStore<T>
  ) {
    if (!entity._componentMap[classRef.name]) return;

    console.log("mctest");

    this.groups.forEach((group) => {
      // TODO: Double check that component.constructor is what we want here
      const groupHasComponent = group.componentClasses.indexOf(classRef) !== -1;
      const entityHasAllComponents = entity.hasAllComponents(
        ...group.componentClasses
      );

      if (groupHasComponent && entityHasAllComponents) {
        group.entities.delete(entity.id);
      }
    });
    // entity.emit('component removed', component)

    delete entity._componentMap[classRef.name];
  }

  public queryComponents = (...componentClasses: Function[]) => {
    const group =
      this.groups.get(this.groupKey(componentClasses)) ??
      this.indexGroup(componentClasses);

    return group?.entities;
  };

  public count = () => this.entities.size;

  private indexGroup = (componentClasses: Function[]) => {
    const key = this.groupKey(componentClasses);

    if (this.groups.has(key)) return;

    this.groups.set(key, new Group(componentClasses));
    const group = this.groups.get(key);

    this.entities.forEach((entity) => {
      if (entity.hasAllComponents(...componentClasses)) {
        group?.entities.set(entity.id, entity);
      }
    });

    return group;
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
  public entities: Map<EntityID, Entity>;

  constructor(componentClasses: Function[] = []) {
    this.componentClasses = componentClasses;
    this.entities = new Map();
  }
}
