import { EventObject, StateMachine, createMachine, interpret } from '../utils/xstate/xstate-dota';

enum MainState {
    'NULL',
    'INIT',
    'BP',
    'SHOW',
    'BATTALE',
    'GAMEOVER',
}

enum BPSTATE {
    'NULL',
    'INIT',
    'SELECT_PLAYER',
    'RED_SELECT',
    'BLUE_SELECT',
    'LOCK',
}

export class GameLoop {
    MainServer: StateMachine.Service<
        object,
        EventObject,
        {
            value: any;
            context: object;
        }
    >;

    BPServer: StateMachine.Service<
        object,
        EventObject,
        {
            value: any;
            context: object;
        }
    >;

    historyRecordPlayer: 'null' | 'blue' | 'red' = 'null';
    redSelectHero: number[] = [];
    blueSelectHero: number[] = [];

    /** 游戏主循环 */
    MainLoop = createMachine(
        {
            id: 'MainLoop',
            initial: 'INIT',
            states: {
                INIT: { on: { change: 'BP' }, entry: 'INIT_ENTRY', exit: 'INIT_EXIT' },
                BP: { on: { change: 'SHOW' }, entry: 'BP_ENTRY', exit: 'BP_EXIT' },
                SHOW: { on: { change: 'BATTALE' }, entry: 'SHOW_ENTRY', exit: 'SHOW_EXIT' },
                BATTALE: { on: { change: 'GAMEOVER' }, entry: 'BATTALE_ENTRY', exit: 'BATTALE_EXIT' },
                GAMEOVER: { entry: 'GAMEOVER_ENTRY' },
            },
        },
        {
            actions: {
                INIT_ENTRY: () => this.MainLoop_INIT_ENTRY(),
                INIT_EXIT: () => this.MainLoop_INIT_EXIT(),
                BP_ENTRY: () => this.MainLoop_BP_ENTRY(),
                BP_EXIT: () => this.MainLoop_BP_EXIT(),
                SHOW_ENTRY: () => this.MainLoop_SHOW_ENTRY(),
                SHOW_EXIT: () => this.MainLoop_SHOW_EXIT(),
                BATTALE_ENTRY: () => this.MainLoop_BATTALE_ENTRY(),
                BATTALE_EXIT: () => this.MainLoop_BATTALE_EXIT(),
                GAMEOVER: () => this.MainLoop_GAMEOVER_ENTRY(),
            },
        }
    );

    BPLoop = createMachine(
        {
            id: 'BPLoop',
            initial: 'INIT',
            states: {
                INIT: { on: { change: 'SELECT_PLAYER' }, entry: 'INIT_ENTRY', exit: 'INIT_EXIT' },
                SELECT_PLAYER: {
                    on: { change_to_red: 'RED_SELECT', change_to_blue: 'BLUE_SELECT', bp_over: 'LOCK' },
                    entry: 'SELECT_PLAYER_ENTRY',
                    exit: 'SELECT_PLAYER_EXIT',
                },
                RED_SELECT: { on: { change: 'SELECT_PLAYER' }, entry: 'RED_SELECT_ENTRY', exit: 'RED_SELECT_EXIT' },
                BLUE_SELECT: { on: { change: 'SELECT_PLAYER' }, entry: 'BLUE_SELECT_ENTRY', exit: 'BLUE_SELECT_EXIT' },
                LOCK: { entry: 'LOCK_ENTRY' },
            },
        },
        {
            actions: {
                INIT_ENTRY: () => this.BPLoop_INIT_ENTRY(),
                INIT_EXIT: () => this.BPLoop_INIT_EXIT(),
                SELECT_PLAYER_ENTRY: () => this.BPLoop_SELECT_PLAYER_ENTRY(),
                SELECT_PLAYER_EXIT: () => this.BPLoop_SELECT_PLAYER_EXIT(),
                RED_SELECT_ENTRY: () => this.BPLoop_RED_SELECT_ENTRY(),
                RED_SELECT_EXIT: () => this.BPLoop_RED_SELECT_EXIT(),
                BLUE_SELECT_ENTRY: () => this.BPLoop_BLUE_SELECT_ENTRY(),
                BLUE_SELECT_EXIT: () => this.BPLoop_BLUE_SELECT_EXIT(),
                LOCK_ENTRY: () => this.BPLoop_LOCK_ENTRY(),
            },
        }
    );

    Timer(cb: () => number | null, interval: number) {
        GameRules.GetGameModeEntity().SetContextThink(DoUniqueString('timer'), cb, interval);
    }

    SetGameState(mainState: MainState, minState: BPSTATE) {
        CustomNetTables.SetTableValue('gameloop', 'current_state', {
            mainState: mainState,
            minState: minState,
        });
    }

    constructor() {}

    Start() {
        this.MainServer = interpret(this.MainLoop).start();
    }

    MainLoop_INIT_ENTRY(): void {
        print('主循环初始化状态开始');
        this.SetGameState(MainState.INIT, BPSTATE.NULL);
        this.Timer(() => {
            this.MainServer.send('change');
            return null;
        }, 3);
    }

    MainLoop_INIT_EXIT(): void {
        print('主循环初始化状态结束');
    }

    MainLoop_BP_ENTRY(): void {
        print('主循环准备启动BP状态机');
        this.SetGameState(MainState.BP, BPSTATE.INIT);
        this.Timer(() => {
            this.BPServer = interpret(this.BPLoop).start();
            return null;
        }, 3);
    }

    MainLoop_BP_EXIT(): void {
        print('主循环启动bp状态结束');
    }

    MainLoop_SHOW_ENTRY(): void {
        print('主循环显示状态开始');
        this.SetGameState(MainState.SHOW, BPSTATE.NULL);
        this.Timer(() => {
            this.MainServer.send('change');
            return null;
        }, 3);
    }

    MainLoop_SHOW_EXIT(): void {
        print('主循环显示状态结束');
    }

    MainLoop_BATTALE_ENTRY(): void {
        print('主循环进入对战状态');
        this.SetGameState(MainState.BATTALE, BPSTATE.INIT);
        this.Timer(() => {
            this.MainServer.send('change');
            return null;
        }, 3);
    }

    MainLoop_BATTALE_EXIT(): void {
        print('主循环结束对战状态');
    }

    MainLoop_GAMEOVER_ENTRY(): void {
        this.SetGameState(MainState.GAMEOVER, BPSTATE.INIT);
        print('游戏结束');
    }

    /** BP loop */
    BPLoop_INIT_ENTRY(): void {
        print('bp模块启动');
        this.Timer(() => {
            this.BPServer.send('change');
            return null;
        }, 3);
    }

    BPLoop_INIT_EXIT(): void {
        print('bp模块启动完成');
    }

    BPLoop_SELECT_PLAYER_ENTRY(): void {
        print('bp进入选择状态');
        this.SetGameState(MainState.BP, BPSTATE.SELECT_PLAYER);

        let state;
        if (this.historyRecordPlayer == 'null') {
            state = RandomInt(0, 1) == 1 ? 'change_to_red' : 'change_to_blue';
        } else if (this.historyRecordPlayer == 'blue') {
            state = 'change_to_red';
        } else {
            state = 'change_to_blue';
        }

        if (this.redSelectHero.length == this.blueSelectHero.length && this.redSelectHero.length == 4) {
            state = 'bp_over';
        }

        this.BPServer.send(state);
    }

    BPLoop_SELECT_PLAYER_EXIT(): void {
        print('bp退出选择状态');
    }

    BPLoop_RED_SELECT_ENTRY(): void {
        print('bp模块开始红方选择');
        this.SetGameState(MainState.BP, BPSTATE.RED_SELECT);
        this.Timer(() => {
            this.redSelectHero.push(this.redSelectHero.length);
            this.BPServer.send('change');
            return null;
        }, 3);
    }

    BPLoop_RED_SELECT_EXIT(): void {
        print('bp模块结束红方选择');
        this.historyRecordPlayer = 'red';
    }

    BPLoop_BLUE_SELECT_ENTRY(): void {
        print('bp模块开始蓝方选择');
        this.SetGameState(MainState.BP, BPSTATE.BLUE_SELECT);
        this.Timer(() => {
            this.blueSelectHero.push(this.blueSelectHero.length);
            this.BPServer.send('change');
            return null;
        }, 3);
    }

    BPLoop_BLUE_SELECT_EXIT(): void {
        print('bp模块结束蓝方选择');
        this.historyRecordPlayer = 'blue';
    }

    BPLoop_LOCK_ENTRY(): void {
        print('bp锁定');
        this.SetGameState(MainState.BP, BPSTATE.LOCK);
        this.Timer(() => {
            this.MainServer.send('change');
            return null;
        }, 3);
    }
}
