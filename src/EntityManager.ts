import { Component } from "./Component";
import { Entity, EntityID, TypeStore } from "./Entity";

interface TagPool {
  [tag: string]: Map<EntityID, Entity>;
}

/**
 * Wrapper class for a particular group of entities. Aims
 * to have users not worry about the IDs of entities as
 * they're iterating, while maintaining the efficiencies
 * of the underlying implementations map iteration.
 */
class EntityGroup implements Iterable<Entity> {
  private groupRef: Map<EntityID, Entity>;

  constructor(groupRef: Map<EntityID, Entity>) {
    this.groupRef = groupRef;
  }

  *[Symbol.iterator]() {
    // Is this even saving us anything...? It looks like
    // it has to create an array(s) anyways...
    for (const [id, entity] of this.groupRef) {
      yield entity;
    }
  }

  get(entity: Entity): Entity | undefined {
    return this.groupRef?.get(entity!.id);
  }

  getById(id: EntityID): Entity | undefined {
    return this.groupRef?.get(id);
  }

  has(entity: Entity): boolean {
    return this.groupRef?.get(entity!.id) !== undefined;
  }

  hasById(id: EntityID): boolean {
    return this.groupRef?.get(id) !== undefined;
  }

  size() {
    return this.groupRef?.size ?? 0;
  }

  toArray(): Entity[] {
    return this.groupRef ? Array.from(this.groupRef.values()) : [];
  }

  forEach(callbackfn: (value: Entity, index: number, array: Entity[]) => void) {
    const arr = this.toArray();
    for (let i = 0; i < arr.length; ++i) {
      callbackfn(arr[i], i, arr);
    }
  }
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
    return new EntityGroup(this.tags[tag]);
  };

  public entityAddComponent = (entity: Entity, component: Component) => {
    if (entity._componentMap[component.constructor.name]) {
      throw new Error(
        `Entity ${entity.id} already has component ${component.constructor.name}`
      );
    }
    entity._componentMap[component.constructor.name] = component;

    // Note: We're lazily indexing entities/groups on queries, rather than
    // on each component addition. Now that we're using the map method,
    // it probably makes more sense to just do it here
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
      const entityNotAlreadyInGroup = !group.entities.has(entity.id);

      if (
        componentIsInGroup &&
        entityHasAllComponents &&
        entityNotAlreadyInGroup
      ) {
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

    this.groups.forEach((group) => {
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

    return new EntityGroup(group.entities);
  };

  public count = () => this.entities.size;

  private indexGroup = (componentClasses: Function[]): Group => {
    const key = this.groupKey(componentClasses);

    if (this.groups.has(key)) {
      return this.groups.get(key)!;
    }

    this.groups.set(key, new Group(componentClasses));
    const group = this.groups.get(key)!;

    this.entities.forEach((entity) => {
      if (entity.hasAllComponents(...componentClasses)) {
        group.entities.set(entity.id, entity);
      }
    });

    // Guaranteed non-null because we set its value above
    return group!;
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

  constructor(componentClasses: Function[]) {
    this.componentClasses = componentClasses;
    this.entities = new Map();
  }
}
