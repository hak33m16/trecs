[![npm version](https://badge.fury.io/js/trecs.svg)](https://badge.fury.io/js/trecs) [![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen.svg)](https://opensource.org/licenses/MIT) 

[![Build Status](https://github.com/hak33m16/trecs/workflows/build/badge.svg?branch=master)](https://github.com/hak33m16/trecs/actions?query=workflow%3Abuild+branch%3Amaster) [![codecov](https://codecov.io/gh/hak33m16/trecs/branch/master/graph/badge.svg?token=QG2BOJPZC3)](https://codecov.io/gh/hak33m16/trecs) [![Code Climate](https://codeclimate.com/github/hak33m16/trecs/badges/gpa.svg)](https://codeclimate.com/github/hak33m16/trecs)

# TrECS

**T**ypeSc**r**ipt-first **E**ntity **C**omponent **S**ystem

> A medium-sized entity-component-system module forked from [`nano-ecs`](https://github.com/hackergrrl/nano-ecs)

## Installation

```
npm install trecs
```

## Usage

Manage your entities via an `EntityManager` instance:

```ts
import { EntityManager } from "trecs"

const world = new EntityManager()
```

### Creating Entities

Create an entity, bereft of components:

```ts
const hero = world.createEntity();
```

### Adding Components

Components must extend the base class `Component` for type-safety reasons.

A component is just a class that defines whatever properties on `this` that
it'd like:

```ts
class PlayerControlled extends Component {
  this.gamepad: number = 1;
}
```

```ts
class Sprite extends Component {
  this.image: string = 'hero.png';
}
```

It's recommended to add components using the `component` helper method:
```ts
const spriteRef = hero.component(Sprite)
spriteRef.image = 'new-image.png'
```

The `component` method will either return a reference to the entities instance of that particular type, or it will auto construct it before doing so.

If you'd like to add multiple components at once, the `addComponents` method is available, but will require that you retrieve them through other accessors afterwards.

```ts
hero.addComponents(PlayerControlled, Sprite)
```

Components can then be retrieved with `component`:

```ts
hero.component(PlayerControlled).gamepad = 2
hero.component(Sprite).image === 'hero.png'; // true
```

Optionally, there's the `getComponent` method, but it won't auto construct components for you and therefore can't guarantee that what it returns is defined:

```ts
hero.getComponent(PlayerControlled)!.gamepad = 2 // note the !. to guarantee non-null
```

In order to check if an entity has a component, use the helper method `hasComponent`:

```ts
hero.hasComponent(PlayerControlled) // true
```

A set of components can also be quickly checked:

```ts
if (hero.hasAllComponents(Transform, Sprite)) { ... }
```

Entities can be tagged with a string for fast retrieval:

```ts
hero.addTag('player');

...

const hero = world.queryTag('player').toArray()[0]
```

You can also remove components and tags in much the same way:

```ts
hero.removeComponent(Sprite);
hero.removeTag('player');
```

### Querying Entities

The entity manager indexes entities and their components, allowing extremely
fast queries.

Entity queries return read-only reference to a group of entities.

Get all entities that have a specific set of components:

```ts
const toDraw = world.queryComponents(Transform, Sprite);
```

Get all entities with a certain tag:

```ts
const enemies = world.queryTag('enemy');
```

The type of the returned query is also directly iterable:

```ts
const objects = world.queryComponents(Position, Velocity)
for (const entity of objects) { ... }
```

Note that the underlying group can be modified by anything that has a reference to your entity manager. If you need a copy of the results that won't be modified, create an array of the results.

```ts
const objects = world.queryComponents(Position, Velocity)

const myCopy = objects.toArray()
// OR
const myCopy = Array.from(objects)
```

### Removing Entities

To remove an entity from a manager, all of its components, and all of its tags, use `remove`:

```ts
hero.remove();
```

To remove a particular component, use `removeComponent`:

```ts
hero.removeComponent(Sprite)
```

To remove a tag, use `removeTag`:

```ts
hero.removeTag('player')
```

### Components

As mentioned above, components must extend the base class `Component` for type-safety reasons. It is highly recommended that components are lean data containers, leaving all the heavy lifting for systems. If interface names weren't erased after transpilation, this library would've used them instead of classes.

### Creating Systems

In `trecs`, there is no formal notion of a system. A system is considered any
context in which entities and their components are updated. As to how this
occurs will vary depending on your use. (Note that this will change soon, and the goal of this library is to provide this functionality.)

In the example of a game, you could maintain a list of systems that are
instantiated with a reference to the entity's world:

```ts
function PhysicsSystem (world)
{
  this.update = function (dt, time) {
    var candidates = world.queryComponents(Transform, RigidBody);

    for (const entity of candidates) {
      ...
    }
  }
}
```

### Events

Event management is not yet built in, but will follow a structure very similar to that of the `entityx` C++ library.

## Testing

Testing is done with jest and can be run using the `npm run test` command.

## License
Copyright 2014 Brandon Valosek, forked and modified by Stephen Whitmore. Forked and modified more by Hakeem Badran.

**trecs** is released under the MIT license.
