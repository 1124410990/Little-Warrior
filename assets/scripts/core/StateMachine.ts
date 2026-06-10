export interface StateDefinition<Context> {
  enter?: (context: Context) => void;
  update?: (context: Context, deltaTime: number) => void;
  exit?: (context: Context) => void;
  canEnter?: (context: Context) => boolean;
}

export interface TransitionOptions {
  reenter?: boolean;
}

export class StateMachine<StateName extends string, Context> {
  private readonly context: Context;
  private readonly states: Record<StateName, StateDefinition<Context>>;
  private currentStateName: StateName;

  constructor(
    context: Context,
    states: Record<StateName, StateDefinition<Context>>,
    initialState: StateName,
  ) {
    this.context = context;
    this.states = states;
    this.currentStateName = initialState;
    this.states[this.currentStateName].enter?.(this.context);
  }

  get current(): StateName {
    return this.currentStateName;
  }

  transitionTo(nextStateName: StateName, options: TransitionOptions = {}): boolean {
    if (nextStateName === this.currentStateName && !options.reenter) {
      return true;
    }

    const nextState = this.states[nextStateName];
    if (!nextState.canEnter?.(this.context) && nextState.canEnter) {
      return false;
    }

    this.states[this.currentStateName].exit?.(this.context);
    this.currentStateName = nextStateName;
    nextState.enter?.(this.context);
    return true;
  }

  update(deltaTime: number): void {
    this.states[this.currentStateName].update?.(this.context, deltaTime);
  }
}
