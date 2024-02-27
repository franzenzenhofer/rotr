// Configuration object for easy tuning and better maintainability
const config = {
  canvasId: 'gameCanvas',
  neonEffect: { blur: 20 },
  entities: {
    rotar: {
      default: {
        radiusRange: [15, 35],
        lifeRange: [5, 5],
        speedRange: [-3, 3],
        attackCountRange: [8, 11]
      }
    },
    dervish: {
      default: {
        radiusRange: [4, 6],
        speedRange: [0.04, 0.06],
        distanceIncrementRange: [1, 3]
      }
    },
    game: {
      entityCount: 5
    }
  }
};


// Utility functions
const randomInRange = (min, max) => Math.random() * (max - min) + min;
const randomChoice = () => Math.random() < 0.5 ? 1 : -1;

class Entity {
  constructor(x, y, radius) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.canvas = document.getElementById(config.canvasId);
  }

  draw(ctx) {
    // Common draw configurations for neon effect
    ctx.shadowBlur = config.neonEffect.blur;
    ctx.shadowColor = this.clan;
  }

  collisionDetection(otherEntity) {
    const dx = otherEntity.x - this.x;
    const dy = otherEntity.y - this.y;
    const distance = Math.hypot(dx, dy);
    return distance < this.radius + otherEntity.radius;
  }
}

class Dervish extends Entity {
  constructor(x, y, radius, color, speed, angle, distance, owner) {
    super(x, y, radius);
    this.color = color;
    this.speed = speed;
    this.angle = angle;
    this.distance = distance;
    this.owner = owner; // The rotar that owns this dervish
  }

  draw(ctx) {
    super.draw(ctx);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  isColliding(other) {
    const distance = Math.hypot(this.x - other.x, this.y - other.y);
    return distance < (this.radius + other.radius);
  }

  hasMinimalDistance(rotar = this.owner) {
    // If the dervish is not at least 2 units away from the rotar radius
    if (this.distance < rotar.radius + 5) {
      // Increase this.distance to ensure the minimum distance
      this.distance = rotar.radius + 1;
    }
  }
}

function returnNewRotar(canvas, x, y, radius, clan, attackCount) {
  x = x || randomInRange(0, canvas.width);
  y = y || randomInRange(0, canvas.height);
  radius = radius || randomInRange(...config.entities.rotar.default.radiusRange);
  clan = clan || Math.random().toString(36).substring(7); // Generate a random clan name
  attackCount = attackCount || Math.floor(randomInRange(...config.entities.rotar.default.attackCountRange));

  return new Rotar(x, y, radius, clan, attackCount);
}

class Rotar extends Entity {

  constructor(x, y, radius, clan, attackCount, create_dervishes = true) {
    super(x, y, radius);
    this.clan = clan;
    this.attackCount = attackCount;
   


    this.dx = randomInRange(...config.entities.rotar.default.speedRange);
    this.dy = randomInRange(...config.entities.rotar.default.speedRange);
    this.initialSpeedX = this.dx*1,5;
    this.initialSpeedY = this.dy*1,5;
    this.life = randomInRange(...config.entities.rotar.default.lifeRange);
    this.randomRotarName = Math.random().toString(36).substring(7);
    this.id = this.randomRotarName;
    //console.log(this.randomRotarName);
    //console.log(this.life);

    this.dead = false;
    this.fadeTime = 1;
    this.time = 0;
    if(create_dervishes) {
      this.dervishes = this.initDervishes();
    }
    else {
      this.dervishes = [];
    }
  }

  addLife(otherRotar) {
    if(otherRotar.life > 1) {
      this.life += 1;
      this.radius += 1;
      // Don't change dervishes' distances here
    } 
  }

  substractLife() {
    if (this.life > 1) {
      this.life -= 1;
      this.radius -= 1;
      // Don't change dervishes' distances here
    }
  }


  gravitateTowards(rotars) {
    rotars.forEach(rotar => {
      if (rotar !== this && rotar.clan !== this.clan) {
        let directionX = rotar.x - this.x;
        let directionY = rotar.y - this.y;

        // Calculate the length of the direction vector
        let length = Math.sqrt(directionX * directionX + directionY * directionY);

        // Normalize the direction vector
        let unitX = directionX / length;
        let unitY = directionY / length;

        // Define a small constant for the amount of movement
        let movementAmount = 0.0000001;

        // If the rotar has fewer dervishes, run away from it
        if (rotar.dervishes.length < this.dervishes.length) {
          this.dx -= unitX * movementAmount;
          this.dy -= unitY * movementAmount;
        } else if (rotar.dervishes.length > this.dervishes.length) {
          // If the rotar has more dervishes, run towards it
          this.dx += unitX * movementAmount;
          this.dy += unitY * movementAmount;
        }
      }
    });
  }

  update() {
    this.time += this.speed;
    this.x += this.dx;
    this.y += this.dy;

    // Define a bounce factor that determines how strongly the object bounces away
    const bounceFactor = 1.01;

    // Check if the object has hit the right or left border
    if (this.x + this.radius > this.canvas.width) {
      this.x = this.canvas.width - this.radius;
      this.dx = -Math.abs(this.dx) * bounceFactor;
    } else if (this.x - this.radius < 0) {
      this.x = this.radius;
      this.dx = Math.abs(this.dx) * bounceFactor;
    }

    // Check if the object has hit the bottom or top border
    if (this.y + this.radius > this.canvas.height) {
      this.y = this.canvas.height - this.radius;
      this.dy = -Math.abs(this.dy) * bounceFactor;
    } else if (this.y - this.radius < 0) {
      this.y = this.radius;
      this.dy = Math.abs(this.dy) * bounceFactor;
    }

        // Gradually reduce speed back to initial speed
        if (this.dx > this.initialSpeedX) {
          this.dx -= 0.01;
        } else if (this.dx < this.initialSpeedx) {
          this.dx += 0.01;
        }
    
        if (this.dy > this.initialSpeedy) {
          this.dy -= 0.01;
        } else if (this.dy < this.initialSpeedy) {
          this.dy += 0.01;
        }
  }

  death() {
    this.dead = true;
    this.fadeTime = 1;
  }


  gainDervish(d) {
    // Don't set d.distance here; it should remain as initially set
    d.owner = this;
    this.dervishes.push(d);
  }

  createOffspring(force = false) {


    console.log(force);
    if(force == false) {
      if (this.dervishes.length < 12) {
       return null;
    }
  }


    // Ensure x and y are valid numbers
    if (isNaN(this.x) || isNaN(this.y)) {
      console.error(`Invalid x or y value for rotar`);
      return null;
    }

    // Create two new rotars with random properties but the same clan
    const offset = this.radius + Math.random() * 10;
    const direction = Math.random() < 0.5 ? -1 : 1; // Randomly choose a direction
    const x1 = this.x + offset * direction; // Add or subtract the radius from x
    const y1 = this.y + offset * direction; // Add or subtract the radius from y
    const x2 = this.x - offset * direction; // Add or subtract the radius from x
    const y2 = this.y - offset * direction; // Add or subtract the radius from y
    const radius = randomInRange(...config.entities.rotar.default.radiusRange);
    const attackCount = Math.floor(randomInRange(...config.entities.rotar.default.attackCountRange));
    const clan = Math.random() < 0.2 ? createNewClan() : this.clan;
    let offspring1 = new Rotar(x1, y1, radius, clan, attackCount, false);
    let offspring2 = new Rotar(x2, y2, radius, clan, attackCount, false);

    offspring1.life = Math.floor(this.life);
    offspring2.life = Math.floor(this.life);
    this.life = 1;

    // Transfer all dervishes to offspring based on a 50% probability
    this.dervishes.forEach((dervish, index) => {
      // When transferring dervish, maintain its current distance
      const currentDistance = dervish.distance;
      if (index % 2 === 0) {
        offspring1.gainDervish(dervish);
      } else {
        offspring2.gainDervish(dervish);
      }
      dervish.distance = currentDistance; // Reset the distance after gaining it
    });

    this.dervishes = []; // Clear the dervishes from the parent

    return [offspring1, offspring2];
  }

  initDervishes() {
    return Array.from({ length: this.attackCount }, (_, i) => {
      const angleStep = Math.PI * 2 / this.attackCount;
      const angle = i * angleStep;
      const distance = this.radius + this.life + i * randomInRange(...config.entities.dervish.default.distanceIncrementRange);
      const dervishX = this.x + distance * Math.cos(angle);
      const dervishY = this.y + distance * Math.sin(angle);
      let speed = randomInRange(...config.entities.dervish.default.speedRange);
      speed *= randomChoice();
      return new Dervish(dervishX, dervishY, randomInRange(...config.entities.dervish.default.radiusRange), this.clan, speed, angle, distance, this);
    });
  }

  draw(ctx) {
    super.draw(ctx);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
    ctx.strokeStyle = this.clan;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.life, 0, 2 * Math.PI, false);
    ctx.fillStyle = this.clan;
    ctx.fill();
    this.dervishes.forEach(dervish => dervish.draw(ctx));
  }
}

let golden_ratio_conjugate = 0.618033988749895;
let h = Math.random();

function createNewClan() {
  h += golden_ratio_conjugate;
  h %= 1;
  return hsvToRgb(h, 0.99, 0.99); // High saturation and value to get neon colors
}

const clans = Array.from({length: 15}, () => {
  h += golden_ratio_conjugate;
  h %= 1;
  return hsvToRgb(h, 0.99, 0.99); // High saturation and value to get neon colors
});

function hsvToRgb(h, s, v) {
  let h_i = Math.floor(h*6);
  let f = h*6 - h_i;
  let p = v * (1 - s);
  let q = v * (1 - f*s);
  let t = v * (1 - (1 - f) * s);
  let r, g, b;
  switch(h_i) {
    case 0: [r, g, b] = [v, t, p]; break;
    case 1: [r, g, b] = [q, v, p]; break;
    case 2: [r, g, b] = [p, v, t]; break;
    case 3: [r, g, b] = [p, q, v]; break;
    case 4: [r, g, b] = [t, p, v]; break;
    case 5: [r, g, b] = [v, p, q]; break;
  }
  return '#' + [r, g, b].map(x => {
    let hex = Math.floor(x*256).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

const assignClan = () => {
  if (clans.length === 0) {
    throw new Error('No more clans available to assign');
  }

  // Get a random index
  const randomIndex = Math.floor(Math.random() * clans.length);

  // Get the clan at the random index
  const clan = clans[randomIndex];

  // Remove the clan from the array
  clans.splice(randomIndex, 1);

  return clan;
};

class Game {
  constructor(config) {
    this.canvas = document.getElementById(config.canvasId);
    this.updateCanvasSize();
    this.canvas.style.backgroundColor = 'black';
    this.ctx = this.canvas.getContext('2d');
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.rotars = this.initRotars(config.entities.game.entityCount);
    this.lastTime = 0;
    this.loop = this.loop.bind(this);
    this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));
    
    requestAnimationFrame(this.loop);
  }

  handleDoubleClick(event) {
    ////////console.log(event.clientX, event.clientY);
    // Calculate the canvas position relative to the viewport
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if any rotar was clicked
    for (let i = 0; i < this.rotars.length; i++) {
      const rotar = this.rotars[i];
      const distance = Math.hypot(rotar.x - x, rotar.y - y);
      if (distance < rotar.radius) {
        console.log('Rotar was clicked');
        // The rotar was clicked, create offspring
        const offspring = rotar.createOffspring(true);
        if (offspring) {
          // Add the new offspring to the rotars array
          this.rotars = this.rotars.concat(offspring);
        }
        break;
      }
    }
  }

  updateCanvasSize() {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
  }

  initRotars(count) {
    return Array.from({ length: count }, () => {
      const x = randomInRange(0, this.canvas.width);
      const y = randomInRange(0, this.canvas.height);
      const radius = randomInRange(...config.entities.rotar.default.radiusRange);
      const attackCount = Math.floor(randomInRange(...config.entities.rotar.default.attackCountRange));
      const clan = assignClan();
      return new Rotar(x, y, radius, clan, attackCount);
    });
  }

  loop(timestamp) {
    const delta = timestamp - this.lastTime;
    this.lastTime = timestamp;
    this.update(delta);
    this.draw();
    requestAnimationFrame(this.loop);
  }

  update(delta) {
    let newRotars = [];
    this.rotars.forEach((rotar, index) => {
      rotar.gravitateTowards(this.rotars);
      let offspring = rotar.createOffspring();
      if(offspring) {
       newRotars = newRotars.concat(offspring); // Flatten and add offspring
      }
      rotar.update();
      this.handleRotarCollisions(rotar, index);
      this.updateDervishes(rotar);
      this.handleRotarLifecycle(rotar, index, delta);
    });
    if(newRotars.length > 0) {
      this.rotars = this.rotars.concat(newRotars);
    }
  }

  handleRotarCollisions(rotar, index) {
    this.rotars.slice(index + 1)
      .filter(otherRotar => rotar.collisionDetection(otherRotar))
      .forEach(otherRotar => this.handleCollision(rotar, otherRotar));
  }

  handleCollision(rotar, otherRotar) {
    const dx = otherRotar.x - rotar.x;
    const dy = otherRotar.y - rotar.y;
    const distance = Math.hypot(dx, dy);
    let rotate = this.rotate;

    if (distance < rotar.radius + otherRotar.radius) {
      const angle = Math.atan2(dy, dx);
      const sin = Math.sin(angle);
      const cos = Math.cos(angle);

      const pos0 = { x: 0, y: 0 };
      const pos1 = rotate(dx, dy, sin, cos, true);
      const vel0 = rotate(rotar.dx, rotar.dy, sin, cos, true);
      const vel1 = rotate(otherRotar.dx, otherRotar.dy, sin, cos, true);

      const vxTotal = vel0.x - vel1.x;
      vel0.x = ((rotar.radius - otherRotar.radius) * vel0.x + 2 * otherRotar.radius * vel1.x) / (rotar.radius + otherRotar.radius);
      vel1.x = vxTotal + vel0.x;

      pos0.x += vel0.x;
      pos1.x += vel1.x;

      const pos0F = rotate(pos0.x, pos0.y, sin, cos, false);
      const pos1F = rotate(pos1.x, pos1.y, sin, cos, false);

      otherRotar.x = rotar.x + pos1F.x;
      otherRotar.y = rotar.y + pos1F.y;
      rotar.x += pos0F.x;
      rotar.y += pos0F.y;

      const vel0F = rotate(vel0.x, vel0.y, sin, cos, false);
      const vel1F = rotate(vel1.x, vel1.y, sin, cos, false);

      // Increase the final velocities to make the bounce effect stronger
      const bounceFactor = 1;
      rotar.dx = vel0F.x * bounceFactor;
      rotar.dy = vel0F.y * bounceFactor;
      otherRotar.dx = vel1F.x * bounceFactor;
      otherRotar.dy = vel1F.y * bounceFactor;
    }
  }

  rotate(x, y, sin, cos, reverse) {
    return {
      x: (reverse) ? (x * cos + y * sin) : (x * cos - y * sin),
      y: (reverse) ? (y * cos - x * sin) : (y * cos + x * sin)
    };
  }

  updateDervishes(rotar) {
    rotar.dervishes.forEach((dervish, dervishIndex) => {
      this.updateDervishPosition(dervish, rotar);
      let collidingRotar = this.detectCollisionBetweenDervishAndRotars(dervish, this.rotars);
      let collidingRotarDervishes = this.detectCollisionBetweenADervishAndTheDevishesOfOtherRotars(dervish, this.rotars);
      this.stealDervishIfEligible(dervish, rotar, collidingRotarDervishes, dervishIndex);
    });
  }

  updateDervishPosition(dervish, rotar) {
    dervish.angle += dervish.speed;
    const distance = dervish.distance;
    dervish.x = rotar.x + distance * Math.cos(dervish.angle);
    dervish.y = rotar.y + distance * Math.sin(dervish.angle);
  }

  detectCollisionBetweenADervishAndTheDevishesOfOtherRotars(dervish, rotars) {
    let collidingDervish = null;
    rotars.forEach(otherRotar => {
      if (otherRotar !== dervish.owner) {
        otherRotar.dervishes.forEach(otherDervish => {
          if (dervish.collisionDetection(otherDervish)) {
            collidingDervish = otherDervish;
          }
        });
      }
    });
    return collidingDervish ? collidingDervish.owner : null;
  }

  detectCollisionBetweenDervishAndRotars(dervish, rotars) {
    let collidingRotar = null;
    rotars.forEach(rotar => {
      if (rotar !== dervish.owner && dervish.collisionDetection(rotar)) {
        collidingRotar = rotar;
        //console.log(`Dervish from rotar ${dervish.owner.id} collided with rotar ${rotar.id}`);
        
        // Check if the rotars belong to the same clan
        if (rotar.clan === dervish.owner.clan) {
          return; // They are from the same clan, so don't modify life
        }

        // If a dervish hits a rotar that is not its owner, the rotar loses one life
        //rotar.substractLife();
        //console.log(`Rotar ${rotar.id} lost one life, now has ${rotar.life}`);
        // The owner of the dervish gains one life
        //dervish.owner.addLife(rotar);
        //console.log(`Rotar ${dervish.owner.id} gained one life, now has ${dervish.owner.life}`);
      }
    });
    return collidingRotar;
  }

  stealDervishIfEligible(dervish, rotar, collidingRotar, dervishIndex) {
    if (collidingRotar && collidingRotar.dervishes.length > rotar.dervishes.length) {
      // Check if the rotars belong to the same clan
      if (rotar.clan === collidingRotar.clan) {
        return; // They are from the same clan, so don't steal the dervish
      }

      dervish.owner = collidingRotar;
      collidingRotar.gainDervish(dervish);
      rotar.dervishes.splice(dervishIndex, 1);
    }
  }

  handleRotarLifecycle(rotar, index, delta) {
    this.handleRotarDeath(rotar);
    this.decreaseFadeTime(rotar, delta);
    this.removeRotar(this.rotars, index, rotar);
  }

  handleRotarDeath(rotar) {
    if (rotar.dervishes.length === 0 && !rotar.dead) {
      rotar.death();
    }
  }

  decreaseFadeTime(rotar, delta) {
    if (rotar.dead) {
      rotar.fadeTime -= delta / 1000;
    }
  }

  removeRotar(rotars, index, rotar) {
    if (rotar.dead && rotar.fadeTime <= 0) {
      rotars.splice(index, 1);
    }
  }

  draw() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.rotars.forEach(rotar => {
      if (!rotar.dead || rotar.fadeTime > 0) {
        this.ctx.globalAlpha = rotar.fadeTime;
        rotar.draw(this.ctx);
      }
      this.ctx.globalAlpha = 1;
    });

    this.ctx.fillStyle = 'black';
    this.ctx.globalAlpha = 1;
    this.ctx.shadowBlur = 0;
    this.ctx.shadowColor = 'transparent';
  }
}

const game = new Game(config);
