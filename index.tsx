import React from "react";
import ReactDOM from "react-dom";

type Particle = {
  x: number;
  y: number;
  // track the past coordinates of each particle to create a trail effect, increase the coordinate count to create more prominent trails
  coordinates: [number, number][];
  // set a random angle in all possible directions, in radians
  angle: number;
  speed: number;
  // friction will slow the particle down
  friction: number;
  // gravity will be applied and pull the particle down
  gravity: number;
  brightness: number;
  alpha: number;
  // set how fast the particle fades out
  decay: number;
};

type Explosion = {
  x: number;
  y: number;
  particles: Particle[];
};

type Laser = {
  x: number;
  y: number;
  // starting coordinates
  sx: number;
  sy: number;
  // target coordinates
  tx: number;
  ty: number;
  // distance from starting point to target
  distanceToTarget: number;
  distanceTraveled: number;
  // track the past coordinates of each firework to create a trail effect, increase the coordinate count to create more prominent trails
  coordinates: [number, number][];
  angle: number;
  speed: number;
  acceleration: number;
  brightness: number;
  // circle target indicator radius
  targetRadius: number;
};

type GameState = {
  lasers: Laser[];
  explosions: Explosion[];
};

const LASER_TRAIL = 3; // the length of the trail on the laser
const PARTICLE_TRAIL = 5; // the length of the trail on particles
const CANVAS = {
  width: 500,
  height: 500,
};

const calculateDistance = (
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number
) => {
  var xDistance = p1x - p2x,
    yDistance = p1y - p2y;
  return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
};

// get a random number within a range
function random(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

const drawParticle = (ctx: CanvasRenderingContext2D, state: Particle) => {
  ctx.beginPath();
  // move to the last tracked coordinates in the set, then draw a line to the current x and y
  ctx.moveTo(
    state.coordinates[state.coordinates.length - 1][0],
    state.coordinates[state.coordinates.length - 1][1]
  );
  ctx.lineTo(state.x, state.y);
  ctx.strokeStyle = `hsla(white, 100%, ${state.brightness}%, ${state.alpha})`;
  ctx.stroke();
};

const drawLaser = (ctx: CanvasRenderingContext2D, state: Laser) => {
  ctx.beginPath();
  // move to the last tracked coordinate in the set, then draw a line to the current x and y
  ctx.moveTo(
    state.coordinates[state.coordinates.length - 1][0],
    state.coordinates[state.coordinates.length - 1][1]
  );
  ctx.lineTo(state.x, state.y);
  ctx.strokeStyle = "white";
  ctx.stroke();

  ctx.beginPath();
  // draw the target for this firework with a pulsing circle
  ctx.arc(state.tx, state.ty, state.targetRadius, 0, Math.PI * 2);
  ctx.stroke();
};

const drawBoard = (ctx: CanvasRenderingContext2D, state: GameState) => {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
    state.lasers.forEach(_ => drawLaser(ctx, _));
    state.explosions.forEach(_ => _.particles.forEach(_ => drawParticle(ctx, _)));
}

const createParticle = (x: number, y: number): Particle => ({
  x: x,
  y: y,
  // track the past coordinates of each particle to create a trail effect, increase the coordinate count to create more prominent trails
  coordinates: Array.from({ length: PARTICLE_TRAIL }, () => [x, y]),
  // set a random angle in all possible directions, in radians
  angle: random(0, Math.PI * 2),
  speed: random(1, 10),
  // friction will slow the particle down
  friction: 0.95,
  // gravity will be applied and pull the particle down
  gravity: 0,
  brightness: random(50, 80),
  alpha: 1,
  // set how fast the particle fades out
  decay: random(0.015, 0.03),
});

const updateParticle = (state: Particle): Particle | undefined => {
  const { x, y } = state;
  const coordinates = [...state.coordinates];
  // remove last item in coordinates array
  coordinates.pop();
  // add current coordinates to the start of the array
  coordinates.unshift([x, y]);

  // slow down the particle
  const speed = state.speed * state.friction;

  // fade out the particle
  const alpha = state.alpha - state.decay;

  // remove the particle once the alpha is low enough, based on the passed in index
  return alpha <= state.decay
    ? undefined
    : {
        ...state,
        coordinates,
        speed,
        alpha,
        // apply velocity
        x: x + Math.cos(state.angle) * speed,
        y: y + Math.sin(state.angle) * speed + state.gravity,
      };
};

const createLaser = (
  sx = Math.floor(CANVAS.width / 2),
  sy = Math.floor(CANVAS.height / 2),
  tx = random(0, Math.floor(CANVAS.width / 2)),
  ty = random(0, Math.floor(CANVAS.height / 2))
): Laser => ({
  x: sx,
  y: sy,
  // starting coordinates
  sx: sx,
  sy: sy,
  // target coordinates
  tx: tx,
  ty: ty,
  // distance from starting point to target
  distanceToTarget: calculateDistance(sx, sy, tx, ty),
  distanceTraveled: 0,
  // track the past coordinates of each firework to create a trail effect, increase the coordinate count to create more prominent trails
  coordinates: Array.from({ length: LASER_TRAIL }, () => [sx, sy]),
  angle: Math.atan2(ty - sy, tx - sx),
  speed: 2,
  acceleration: 1.05,
  brightness: random(50, 70),
  // circle target indicator radius
  targetRadius: 1,
});

const laserReachedTarget = (state: Laser): boolean =>
  state.distanceTraveled >= state.distanceToTarget;

const updateLaser = (state: Laser): Laser => {
  const { x, y } = state;
  const coordinates = [...state.coordinates];
  // remove last item in coordinates array
  coordinates.pop();
  // add current coordinates to the start of the array
  coordinates.unshift([x, y]);

  const targetRadius = state.targetRadius < 8 ? state.targetRadius + 0.3 : 1;

  // accelerate the laser
  const speed = state.speed * state.acceleration;

  // get the current velocities based on angle and speed
  const vx = Math.cos(state.angle) * speed;
  const vy = Math.sin(state.angle) * speed;

  const distanceTraveled = calculateDistance(
    state.sx,
    state.sy,
    state.x + vx,
    state.y + vy
  );

  // if the distance traveled, including velocities, is greater than the initial distance to the target, then the target has been reached
  return {
    ...state,
    coordinates,
    targetRadius,
    speed,
    distanceTraveled,
    x: x + vx,
    y: y + vy,
  };
};

const createExplosion = (x: number, y: number): Explosion => ({
  x,
  y,
  particles: Array.from({ length: 30 }, () => createParticle(x, y)),
});

const updateExplosion = (state: Explosion): Explosion => ({
  ...state,
  particles: state.particles.reduce((prev, particle) => {
    const newPart = updateParticle(particle);
    return newPart ? prev.concat(newPart) : prev;
  }, [] as Particle[]),
});

const createGameState = (): GameState => ({
  explosions: [],
  lasers: Array.from({ length: 1 }, () => createLaser()),
});

const updateState = (state: GameState): GameState => {
  // move all the lasers, if laser reaches destination it will be undefined
  const lasers = state.lasers.map(updateLaser);

  // create explosions for all laser that have reach destination
  const explosions = lasers.reduce(
    (prev, laser) =>
      laserReachedTarget(laser)
        ? prev.concat(createExplosion(laser.x, laser.y))
        : prev,
    [] as Explosion[]
  );

  return {
    ...state,
    // add the new explosions to the existing list
    explosions: state.explosions.concat(explosions).map(updateExplosion),
    // remove lasers that have reached target
    lasers: lasers.reduce(
      (prev, laser) => (laserReachedTarget(laser) ? prev : prev.concat(laser)),
      [] as Laser[]
    ),
  };
};

const App = () => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [, setState] = React.useState<GameState>(createGameState());

  React.useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    const loop = () => {
      id = requestAnimationFrame(loop);
      setState((state) => {
        const newState = updateState(state);
        if (ctx) drawBoard(ctx, newState);
        return newState;
      });
    };
    let id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [canvasRef]);

  return <canvas ref={canvasRef} width={CANVAS.width} height={CANVAS.height} />;
};

ReactDOM.render(<App />, document.querySelector("#root"));
