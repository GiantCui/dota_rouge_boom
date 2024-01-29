import { render, useNetTableKey } from 'react-panorama-x';
import { BPSTATE, MainState } from '../../def/defs';

const BLUE_SELECT_MAIN = ({ on }: { on: boolean }) => {
    return (
        <Panel className={`BLUE_SELECT_MAIN ${on ? 'higt' : 'low'}`}>
            <Label text={'红色玩家选择的英雄有=》'} className="tit" />
        </Panel>
    );
};

const RED_SELECT_MAIN = ({ on }: { on: boolean }) => {
    return (
        <Panel className={`RED_SELECT_MAIN ${on ? 'higt' : 'low'}`}>
            <Label text={'蓝色玩家选择的英雄有=》'} className="tit" />
        </Panel>
    );
};

const POOL = () => {
    return (
        <Panel className="POOL">
            <Label text={'大家可以选择的英雄有=》'} className="tit" />
            <Button id="ExampleButton2ID" className="ExampleButton2Class">
                <Panel className="Contents">
                    <Panel className="CustomIcon" />
                    <Label id="ExampleButton2Label" text="#ExampleButton" />
                </Panel>
            </Button>
        </Panel>
    );
};

const BPMain = () => {
    const gameState = useNetTableKey('gameloop', 'current_state');

    return (
        <Panel className={`BPMain ${gameState?.mainState == MainState.BP ? 'view' : 'close'}`}>
            <BLUE_SELECT_MAIN on={gameState?.minState == BPSTATE.BLUE_SELECT} />
            <RED_SELECT_MAIN on={gameState?.minState == BPSTATE.RED_SELECT} />
            <POOL />
        </Panel>
    );
};

// render(<BPMain />, $.GetContextPanel());
