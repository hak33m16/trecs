import { EntityManager } from "..";
import {
  FirstDummyComponent,
  SecondDummyComponent,
} from "../tests/DummyComponents";

describe("EntityManager", () => {
  let entityManager: EntityManager;
  beforeEach(() => {
    entityManager = new EntityManager();
  });

  test("can remove all entities of a specific tag", () => {
    const entity = entityManager.createEntity();
    entity.addTag("testtag");

    const secondEntity = entityManager.createEntity();
    secondEntity.addTag("testtag");

    const thirdEntity = entityManager.createEntity();

    expect(entity._manager).toBeTruthy();
    expect(secondEntity._manager).toBeTruthy();
    expect(thirdEntity._manager).toBeTruthy();

    entityManager.removeEntitiesByTag("testtag");

    expect(entity._manager).toBeNull();
    expect(secondEntity._manager).toBeNull();
    expect(thirdEntity._manager).toBeTruthy();
  });

  test("can remove all entities", () => {
    const entity = entityManager.createEntity();
    const secondEntity = entityManager.createEntity();

    expect(entity._manager).toBeTruthy();
    expect(secondEntity._manager).toBeTruthy();

    entityManager.removeAllEntities();

    expect(entity._manager).toBeNull();
    expect(entity._manager).toBeNull();
  });

  test("throws error when removing if entity is untracked", () => {
    const entity = entityManager.createEntity();
    entity.remove();

    expect(() => entityManager.removeEntity(entity)).toThrow(
      "Tried to remove entity not in list"
    );
  });

  test("throws error when adding component type twice", () => {
    const entity = entityManager.createEntity();

    entity.addComponents(FirstDummyComponent);
    expect(() => entity.addComponents(FirstDummyComponent)).toThrow();
  });

  test("allows querying by component", () => {
    const entity = entityManager.createEntity();
    const secondEntity = entityManager.createEntity();

    entity.addComponents(FirstDummyComponent, SecondDummyComponent);

    secondEntity.addComponents(FirstDummyComponent);

    const firstQuery = entityManager.queryComponents(
      FirstDummyComponent,
      SecondDummyComponent
    );
    expect(firstQuery.getById(entity.id)).toEqual(entity);
    expect(firstQuery.getById(secondEntity.id)).toBeUndefined();

    const secondQuery = entityManager.queryComponents(FirstDummyComponent);
    expect(secondQuery.getById(entity.id)).toEqual(entity);
    expect(secondQuery.getById(secondEntity.id)).toEqual(secondEntity);

    const thirdQuery = entityManager.queryComponents(SecondDummyComponent);
    expect(thirdQuery.getById(entity.id)).toEqual(entity);
    expect(thirdQuery.getById(secondEntity.id)).toBeUndefined();
  });

  test("clears entities out of component groups when a component is removed", () => {
    const entity = entityManager.createEntity();

    entity.addComponents(FirstDummyComponent);

    expect(entityManager["groups"].size).toEqual(0);
    expect(
      entityManager.queryComponents(FirstDummyComponent).getById(entity.id)
    ).toEqual(entity);
    expect(entityManager["groups"].size).toEqual(1);

    entity.removeComponent(FirstDummyComponent);
    expect(entityManager.queryComponents(FirstDummyComponent).size()).toEqual(
      0
    );
  });

  test("adds components to existing groups", () => {
    const entity = entityManager.createEntity();

    entity.addComponents(FirstDummyComponent);

    expect(entityManager["groups"].size).toBe(0);
    // Create group
    const query = entityManager.queryComponents(FirstDummyComponent);
    expect(query.size()).toBe(1);
    expect(query.getById(entity.id)).toBe(entity);
    expect(entityManager["groups"].size).toBe(1);

    const secondEntity = entityManager.createEntity();
    // Should reuse group
    secondEntity.addComponents(FirstDummyComponent);
    expect(entityManager["groups"].size).toBe(1);

    expect(query.getById(secondEntity.id)).toBe(secondEntity);
  });

  test("retagging entity should do nothing", () => {
    const entity = entityManager.createEntity();

    expect(entityManager.queryTag("testtag").size()).toBe(0);
    entity.addTag("testtag");
    expect(entityManager.queryTag("testtag").getById(entity.id)).toBe(entity);
    // Should do nothing
    entity.addTag("testtag");
    expect(entityManager.queryTag("testtag").getById(entity.id)).toBe(entity);
  });

  test("removing entities by tag that doesnt exist should be fine", () => {
    entityManager.removeEntitiesByTag("nonexistent");
  });

  test("querying by a component group that doesnt exist should return empty map", () => {
    // TODO: Should probably change this behavior
    expect(entityManager.queryComponents(FirstDummyComponent).size()).toBe(0);
  });

  test("returns correct entity count", () => {
    expect(entityManager.count()).toBe(0);
    const entity = entityManager.createEntity();
    expect(entityManager.count()).toBe(1);
    entity.remove();
    expect(entityManager.count()).toBe(0);
  });

  test("impossible normally: make sure indexGroup double calls dont overwrite groups", () => {
    const entity = entityManager.createEntity();

    entity.addComponents(FirstDummyComponent);

    expect(entityManager["groups"].size).toBe(0);
    // Create group
    const entityGroup = entityManager.queryComponents(FirstDummyComponent);
    const groupRef = entityGroup["groupRef"];
    entityManager["indexGroup"]([FirstDummyComponent]);
    // Group is different, but reference is same
    expect(entityManager.queryComponents(FirstDummyComponent)).not.toBe(
      entityGroup
    );
    expect(entityManager.queryComponents(FirstDummyComponent)["groupRef"]).toBe(
      groupRef
    );
  });

  test("can iterate over entity group from query", () => {
    const entity1 = entityManager.createEntity();
    const entity2 = entityManager.createEntity();

    entity1.addComponents(FirstDummyComponent);
    entity2.addComponents(FirstDummyComponent);

    const group = entityManager.queryComponents(FirstDummyComponent);
    let count = 0;
    for (const entity of group) {
      ++count;
    }
    expect(count).toEqual(2);
  });

  test("empty group returns no entities", () => {
    const componentQuery = entityManager.queryComponents(FirstDummyComponent);

    expect(componentQuery.size()).toBe(0);
    expect(componentQuery.getById(0)).toBeUndefined();

    // Tag queries don't always return a group which is why we
    // use optional chaining in the EntityGroup
    const tagQuery = entityManager.queryTag("nonexistent");

    expect(tagQuery.size()).toBe(0);
    expect(tagQuery.getById(0)).toBeUndefined();
  });

  test("forEach allows us to iterate over entities", () => {
    const entity = entityManager.createEntity();
    entity.addComponents(FirstDummyComponent);

    const group = entityManager.queryComponents(FirstDummyComponent);
    group.forEach((groupEntity) => {
      expect(groupEntity).toBe(entity);
    });
  });

  test("forEach and toArray on an undefined group is fine", () => {
    // only way to get an undefined group ref since component
    // groups will have an index/group auto created for them
    const tagQuery = entityManager.queryTag("nonexistent");
    expect(tagQuery["groupRef"]).toBeUndefined();

    expect(() => tagQuery.forEach(() => {})).not.toThrow();
    expect(() => tagQuery.toArray()).not.toThrow();
  });

  test("get/has entity work as expected", () => {
    const entity = entityManager.createEntity();
    entity.addComponents(FirstDummyComponent);

    const group = entityManager.queryComponents(FirstDummyComponent);
    expect(group.has(entity)).toBe(true);
    expect(group.get(entity)).toBe(entity);

    const tagGroup = entityManager.queryTag("nonexistent");
    expect(tagGroup.get(entity)).toBe(undefined);
    expect(tagGroup.has(entity)).toBe(false);
  });

  test("get/has by id work as expected", () => {
    const entity = entityManager.createEntity();
    entity.addComponents(FirstDummyComponent);

    const group = entityManager.queryComponents(FirstDummyComponent);
    expect(group.hasById(entity.id)).toBe(true);
    expect(group.getById(entity.id)).toBe(entity);

    const tagGroup = entityManager.queryTag("nonexistent");
    expect(tagGroup.getById(entity.id)).toBe(undefined);
    expect(tagGroup.hasById(entity.id)).toBe(false);
  });
});
