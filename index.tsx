import React from "react";
import ReactDOM from "react-dom";

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
  coordinateCount: number;
  angle: number;
  speed: number;
  acceleration: number;
  brightness: number;
  // circle target indicator radius
  targetRadius: number;
};

type GameState = {
  lasers: Laser[];
};

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

const drawLaser = (ctx: CanvasRenderingContext2D) => (state: Laser) => {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);

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
  coordinates: Array(3)
    .fill(null)
    .map(() => [sx, sy]),
  coordinateCount: 3,
  angle: Math.atan2(ty - sy, tx - sx),
  speed: 2,
  acceleration: 1.05,
  brightness: random(50, 70),
  // circle target indicator radius
  targetRadius: 1,
});

const updateLaser = (state: Laser): Laser | undefined => {
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
  return distanceTraveled >= state.distanceToTarget
    ? undefined
    : {
        ...state,
        coordinates,
        targetRadius,
        speed,
        distanceTraveled,
        x: x + vx,
        y: y + vy,
      };
};

const createGameState = (): GameState => ({
  lasers: Array(1)
    .fill(null)
    .map(() => createLaser()),
});

const updateState = (state: GameState): GameState => {
  return {
    ...state,
    lasers: state.lasers.reduce((prev, cur) => {
      const exp = updateLaser(cur);
      return exp ? prev.concat(exp) : prev;
    }, [] as Laser[]),
  };
};

const App = () => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [, setState] = React.useState<GameState>(createGameState());

  React.useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    const drawer = ctx && drawLaser(ctx);
    const loop = () => {
      id = requestAnimationFrame(loop);
      setState((state) => {
        const newState = updateState(state);
        if (drawer) newState.lasers.forEach(drawer);
        return newState;
      });
    };
    let id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [canvasRef]);

  return <canvas ref={canvasRef} width={CANVAS.width} height={CANVAS.height} />;
};

ReactDOM.render(<App />, document.querySelector("#root"));
