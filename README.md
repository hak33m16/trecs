[![Build Status](https://github.com/hak33m16/trecs/workflows/build/badge.svg?branch=master)](https://github.com/hak33m16/trecs/actions?query=workflow%3Abuild+branch%3Amaster) [![codecov](https://codecov.io/gh/hak33m16/trecs/branch/master/graph/badge.svg?token=QG2BOJPZC3)](https://codecov.io/gh/hak33m16/trecs) [![Code Climate](https://codeclimate.com/github/hak33m16/trecs/badges/gpa.svg)](https://codeclimate.com/github/hak33m16/trecs) [![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen.svg)](https://opensource.org/licenses/MIT) [![NPM Version](https://badge.fury.io/js/trecs.svg?style=flat)](https://npmjs.org/package/trecs)

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

Components are added using `addComponent` and support chaining:

```ts
hero.addComponent(new PlayerControlled()).addComponent(new Sprite());
```

Retrieve components in a type-safe way:

```ts
hero.component(PlayerControlled).gamepad = 2
hero.component(Sprite).image === 'hero.png'; // true
```

Entities can be tagged with a string for fast retrieval:

```ts
hero.addTag('player');

...

const hero = Array.from(world.queryTag('player').values())[0] // This syntax will get better, I promise
```

You can also remove components and tags in much the same way:

```ts
hero.removeComponent(Sprite);
hero.removeTag('player');
```

`hasComponent` will efficiently determine if an entity has a specific single
component:

```ts
if (hero.hasComponent(Transform)) { ... }
```

A set of components can also be quickly checked:

```ts
if (hero.hasAllComponents(Transform, Sprite)) { ... }
```

### Querying Entities

The entity manager indexes entities and their components, allowing extremely
fast queries.

Entity queries return an array of entities.

Get all entities that have a specific set of components:

```ts
const toDraw = entities.queryComponents(Transform, Sprite);
```

Get all entities with a certain tag:

```ts
const enemies = entities.queryTag('enemy');
```

### Removing Entities

```ts
hero.remove();
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

    candidates.forEach(function(entity) {
      ...
    });
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
