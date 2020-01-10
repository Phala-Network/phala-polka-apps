import { ApiProps } from '@polkadot/react-api/types';
import { I18nProps } from '@polkadot/react-components/types';

import React from 'react';
import { useParams } from 'react-router-dom';
import BN from 'bn.js';
import styled from 'styled-components';
import { Button, Card, Grid, Label, Icon, Input, Progress, Table } from 'semantic-ui-react';
import AppContext, { AppState } from './AppContext';
import { TxButton, InputBalance, Button as PButton } from '@polkadot/react-components';

import { sleep, pubkeyToAccount } from './common/Utils'
import { Item, Order, defaultOrder } from './common/Models';
import { getItem, getOrder, get as getFile } from './API';

import download from 'downloadjs';

interface Props {
  accountId: string | null;
  basePath: string;
}

type StepState = 'na' | 'wait' | 'running' | 'done';

class StepDef {
  name: string;
  ops: Array<Function | null>;
  state: Array<StepState>

  constructor(name: string, ops: Array<Function | null> = [null, null, null], completed = false) {
    this.name = name;
    this.ops = ops;
    this.state = ops.map(o => o ? (completed ? 'done' : 'wait') : 'na');
  }
}

const NullStep = new StepDef('');
function step(ms100, randAdd = 0.1) {
  const ms = Math.floor(ms100 * 100 * (1 + Math.random() * randAdd));
  return () => sleep(ms);
}

interface Progress {
  steps: Array<StepDef>;
  cursor: number;
}

const CHAIN_TIME = 5;

function createSteps(type: string, complete = false): Array<StepDef> {
  if (type == 'item') {
    return [
      new StepDef('加密数据集', [step(5), null, null], complete),
      new StepDef('提交上链', [step(1), null, step(CHAIN_TIME)], complete),
      new StepDef('上传数据', [step(5), step(10), null], complete)
    ];
  } else {
    return [
      new StepDef('加密查询', [step(5), null, null], complete),
      new StepDef('提交上链', [step(1), null, step(CHAIN_TIME)], complete),
      new StepDef('上传查询', [step(5), step(10), null], complete),
      new StepDef('准备数据集', [null, step(5), null], complete),
      new StepDef('等待卖家审核', [null, null, step(30)], complete),
      new StepDef('执行计算', [null, step(10), null], complete),
      new StepDef('加密结果', [null, step(5), null], complete),
    ];
  }
}

async function exec(p: Progress, setProgress: Function) {
  for (let i = p.cursor; i < p.steps.length; i++) {
    console.log(`exec step ${i} / ${p.steps.length}`);
    const current = p.steps[i];
    const jobs = current.ops.map(async (s, idx): Promise<void> => {
      if (s) {
        current.state[idx] = 'running';
        p = {...p};
        setProgress(p);
        await s();
        current.state[idx] = 'done';
        p = {...p};
        setProgress(p);
      }
    });
    await Promise.all(jobs);
    console.log(`exec step ${i} done`);
    p = { ...p, cursor: p.cursor + 1 };
    setProgress(p);
  }
}

export default function Result(props: Props): React.ReactElement<Props> | null {
  const { type, value } = useParams();
  const app = React.useContext(AppContext.Context);
  const [progress, setProgress] = React.useState<Progress>({
    steps: [NullStep],
    cursor: 0
  });
  const [amount, setAmount] = React.useState<BN | undefined>(undefined);
  const [order, setOrder] = React.useState<Order>(defaultOrder());
  const [payee, setPayee] = React.useState<string>('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'); // to //Alice

  const id = parseInt(value);

  React.useEffect(() => {
    let finished: Array<number>;
    if (type == 'item') {
      finished = app.state.items;
    } else {
      finished = app.state.orders;
    }
    console.log('result!', type, value);
    const completed = finished.indexOf(id) >= 0;
    const steps = createSteps(type, completed);
    const p = {
      cursor: completed ? steps.length : 0,
      steps
    };
    setProgress(p);
    (async () => {
      await Promise.all([
        fetchData(),
        exec(p, setProgress)
      ]);
      app.setState((old: AppState): AppState => {
        const s = {...old};
        (type == 'item' ? s.items : s.orders).push(id);
        return s;
      });
    })();
  }, [type, value])

  const done = React.useMemo(() => {
    return progress.cursor == progress.steps.length;
  }, [progress]);

  const percent = React.useMemo(() => {
    return Math.floor(100 * progress.cursor / (progress.steps.length)).toString();
  }, [progress]);

  const paid = React.useMemo(() => {
    if (type != 'order') return false;
    return app.state.paidOrders.indexOf(id) >= 0;
  }, [app.state])

  async function fetchData() {
    if (type == 'order') {
      const o = await getOrder(id);
      setOrder(o);
      const i = await getItem(o.details.item_id);
      const rows = new BN(o.state.matched_rows);
      const toPay = new BN(i.details.price.PerRow.price).mul(rows);
      setAmount(toPay);
      setPayee(pubkeyToAccount[i.seller])
    }
  }

  function setPaid() {
    app.setState((old: AppState): AppState => {
      const s = {...old};
      s.paidOrders.push(id);
      return s;
    });
  }

  async function handleDownload() {
    const content = await getFile(order.state.result_path);
    download(content, `order-${order.id}-result.csv`, 'text/csv');
  }

  return (
    <div>
      <h1>{ type == 'item' ? '上架' : '商品订单' }</h1>
      <hr />

      <h2>执行计划</h2>
      <Grid container>
        <Grid.Row>
          <Grid.Column>
            <Progress percent={percent} autoSuccess>
              {percent}%
            </Progress>
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column>
              <Table fixed inverted>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell></Table.HeaderCell>
                    <Table.HeaderCell textAlign='center'>
                      <Icon name='desktop' size='big' /> <br/>
                      本地计算
                    </Table.HeaderCell>
                    <Table.HeaderCell textAlign='center'>
                      <Icon name='microchip' size='big' /> <br/>
                      TEE计算
                    </Table.HeaderCell>
                    <Table.HeaderCell textAlign='center'>
                      <Icon name='chain' size='big' /> <br/>
                      链上计算
                    </Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {progress.steps.map((s, idx) => (
                    <Table.Row key={idx}>
                      <Table.Cell>
                        {idx < progress.cursor ?
                          (<Icon color='green' name='check circle' />)
                         : idx == progress.cursor ? 
                          (<Icon loading name='circle notch' />)
                         :
                          (<Icon color='grey' name='clock outline' />)}
                        {s.name}
                      </Table.Cell>
                      { s.state.map((opstate, opidx) => (
                        <Table.Cell textAlign='center' key={opidx}>
                          { opstate == 'wait' ?
                            (<Icon color='grey' name='clock outline' />)
                          : opstate == 'running' ?
                            (<Icon loading name='circle notch' />)
                          : opstate == 'done' ?
                            (<Icon color='green' name='check circle' />)
                          : undefined }
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
          </Grid.Column>
        </Grid.Row>
      </Grid>

      {type == 'order' && done && (
        <>
          <h2>查询结果</h2>
          <hr />
          <p>已匹配: {order.state.matched_rows} 条记录</p>
          { !paid ? (
            <div>
              <InputBalance
                label='需要支付'
                defaultValue={amount}
                isDisabled
              />
              <PButton.Group>
                {/* <TxButton
                  accountId={props.accountId}
                  icon='send'
                  label='支付'
                  params={[payee, amount]}
                  tx='balances.transfer'
                  onSuccess={() => {setPaid()}}
                /> */}
                <Button primary onClick={() => {setPaid()}} icon="paper plane">支付</Button>
              </PButton.Group>
            </div>
          ) : (
            <>
              <p><Icon color='green' name='check circle' /> 已支付</p>
              <Button onClick={handleDownload} primary disabled={percent != '100'}>下载结果</Button>
            </>
          )}

          {/* <p>link: {JSON.stringify(order)}</p> */}
        </>
      )}


    </div>
  )
}