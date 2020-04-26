import React from "react";
import ReactDOM from "react-dom";

type Explosion = {
  x: number;
  y: number;
};

type GameState = {
  explosions: Explosion[];
};

const CANVAS = {
  width: 500,
  height: 500,
};

const drawExplosion = (ctx: CanvasRenderingContext2D) => (state: Explosion) => {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);

  ctx.fillStyle = "white";
  ctx.fillRect(state.x, state.y, 3, 3);
};

const createExplosion = (): Explosion => ({
  x: Math.floor(CANVAS.width / 2),
  y: Math.floor(CANVAS.height / 2),
});

const updateExplosion = (state: Explosion): Explosion => {
  return {
      ...state,
      x: state.x < CANVAS.width ? state.x + 3 : state.x,
      y: state.x < CANVAS.height ? state.y + 3 : state.y,
  };
};

const createGameState = (): GameState => ({
    explosions: Array(1).fill(null).map(createExplosion),
})

const updateState = (state: GameState): GameState => {
  return {
    ...state,
    explosions: state.explosions.map(updateExplosion)
  };
};

const App = () => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [, setState] = React.useState<GameState>(createGameState());

  React.useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    const drawer = ctx && drawExplosion(ctx);
    const loop = () => {
      id = requestAnimationFrame(loop);
      setState((state) => {
        const newState = updateState(state);
        if (drawer) newState.explosions.forEach(drawer);
        return newState;
      });
    };
    let id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [canvasRef]);

  return <canvas ref={canvasRef} width={CANVAS.width} height={CANVAS.height} />;
};

ReactDOM.render(<App />, document.querySelector("#root"));
