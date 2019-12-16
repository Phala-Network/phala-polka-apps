import { ApiProps } from '@polkadot/react-api/types';
import { I18nProps } from '@polkadot/react-components/types';

import React, {useState, useEffect} from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { Button, Form, Grid, Header, Label, Icon, Input, Rating, Segment, Table } from 'semantic-ui-react';
import * as Papa from 'papaparse';

import {Item, fmtAmount} from './Models';
import {getItem} from './API';

interface Props extends ApiProps, I18nProps {
}

const defaultItem: Item = {
  id: 0,
  seller: '',
  txref: { blocknum: 0, index: 0},
  details: {
    category: 'null',
    dataset_link: '/null',
    dataset_preview: '',
    description: '',
    name: '',
    price: {PerRow: {price: '0'}},
  },
}

function genDataLabel (name: string, value: string | React.ReactElement, rightClassName: string = '') {
  return (
    <Grid>
      <Grid.Column width={5}>{name}</Grid.Column>
      <Grid.Column width={11} className={rightClassName}>{value}</Grid.Column>
    </Grid>
  )
}

function genDataLabels (dict: Array<[string, string]>) {
  return dict.map(([k, v]) => (
    <Grid.Column width={5}>
      {genDataLabel(k, v)}
    </Grid.Column>
  ))
}

function genTable (csv: string) {
  const dataset = Papa.parse(csv);
  if (dataset.errors.length > 0) {
    return (<div>暂无预览</div>);
  }
  const header = dataset.data[0] as Array<string>;
  let rows = dataset.data.slice(1) as Array<Array<string>>;
  rows = rows.filter(r => r.length == header.length);
  return (
    <Table celled padded>
      <Table.Header>
        <Table.Row>
          {header.map((h, idx) => (<Table.HeaderCell key={idx}>{h}</Table.HeaderCell>))}
        </Table.Row>
      </Table.Header>

      <Table.Body>{
        rows.map((r, ridx) => (
          <Table.Row key={ridx}>{
            r.map((v, vidx) => (
              <Table.Cell key={vidx}>{v}</Table.Cell>
            ))
          }</Table.Row>
        ))
      }</Table.Body>
    </Table>
  )
}

export default function ViewItem({className, t}: Props): React.ReactElement<Props> | null {
  const [item, setItem] = useState<Item>(defaultItem);
  const { value } = useParams();

  useEffect(()=> {
    (async () => {
      const resultItem = await getItem(parseInt(value!));
      setItem(resultItem);
    })();
  }, [value]);

  return (
    <div className={className}>
      <h1>数据商品详情</h1>

      <hr />

      <h2>基本信息</h2>
      <Grid stackable>
        <Grid.Column width={5}>
          <Header as='h3'>{item.details.name}</Header>
        </Grid.Column>
        {genDataLabels([
          ['上传时间', '2018-03-05'],
          ['计价方式', item.details.price.PerRow ? '按量付费' : '其他'],
          ['ID', (10000 + item.id).toString()],
          ['数据总数', '1万条'],
          ['价格', fmtAmount(item.details.price.PerRow.price) + ' 元/条'],
          ['商户', '北京哈希森林科技有限公司'],
          ['数据大小', '2TB']
        ])}
      </Grid>

      <hr />

      <h2>服务信息</h2>
      <Grid stackable>
        <Grid.Column width={5}>
          <Grid columns={1}>
            <Grid.Column>{genDataLabel('数据安全', '已加密，仅限可信环境交易')}</Grid.Column>
            <Grid.Column>{genDataLabel('数据环境', '已上传 ' + item.details.dataset_link, 'text-ellipsis')}</Grid.Column>
            <Grid.Column>{genDataLabel('交易记录', '201次')}</Grid.Column>
          </Grid>
        </Grid.Column>
        <Grid.Column width={11}>
          <Grid columns={1}>
            <Grid.Column>{genDataLabel('数据质量', (<Rating maxRating={5} defaultRating={4} icon='star' size="large" />))}</Grid.Column>
            <Grid.Column>{genDataLabel('数据描述', item.details.description)}</Grid.Column>
          </Grid>
        </Grid.Column>
      </Grid>

      <hr />

      <h2>数据预览</h2>
      {genTable(item.details.dataset_preview)}

      <hr />

      <h2>链上记录</h2>
      <Table celled padded>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>操作时间</Table.HeaderCell>
            <Table.HeaderCell>提交地址</Table.HeaderCell>
            <Table.HeaderCell>查询数量</Table.HeaderCell>
            <Table.HeaderCell>预计收入</Table.HeaderCell>
            <Table.HeaderCell>数据交易类型</Table.HeaderCell>
            <Table.HeaderCell>详情</Table.HeaderCell>
            <Table.HeaderCell>操作</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          <Table.Row>
            <Table.Cell>2019-11-15 12:03</Table.Cell>
            <Table.Cell>//Bob</Table.Cell>
            <Table.Cell>50000</Table.Cell>
            <Table.Cell>50000</Table.Cell>
            <Table.Cell>模版-Join</Table.Cell>
            <Table.Cell>预置模版-建议通过</Table.Cell>
            <Table.Cell><a href='#'>通过</a> <a href='$'>拒绝</a></Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>2019-11-13 14:10</Table.Cell>
            <Table.Cell>//Bob</Table.Cell>
            <Table.Cell>1200</Table.Cell>
            <Table.Cell>1200</Table.Cell>
            <Table.Cell>自定义合约</Table.Cell>
            <Table.Cell><Icon name='exclamation circle' color='yellow' />建议审核代码</Table.Cell>
            <Table.Cell></Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>

    </div>
  )
}