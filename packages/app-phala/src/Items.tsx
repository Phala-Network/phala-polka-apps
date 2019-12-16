import { ApiProps } from '@polkadot/react-api/types';
import { I18nProps } from '@polkadot/react-components/types';

import React from 'react';
import { useHistory } from "react-router-dom";
import styled from 'styled-components';
import { Button, Card, Grid, Label, Icon, Input, Rating } from 'semantic-ui-react';

import Item from './Models';

interface Props extends ApiProps, I18nProps  {
  accountId: string | null;
}

interface DatasetProps extends ApiProps {
  item: Item;
}

function _Dataset ({ basePath, className, item }: DatasetProps): React.ReactElement | null {
  let history = useHistory();

  console.log("_Dataset basePath: " + basePath);
  function handleClick() {
    const id = item.id;
    history.push(`${basePath}/item/${id}`);
  }
  return (
    <Card onClick={handleClick} className={className} raised={false} as='div'>
      <Card.Content>
      <Card.Header>{item.details.name}</Card.Header>
      </Card.Content>
      <Card.Content>
        <Grid>
          <Grid.Row>
            <Grid.Column width={10}>
              <Rating maxRating={5} defaultRating={4} icon='star' />
            </Grid.Column>
            <Grid.Column width={6}>
              已消费123次
            </Grid.Column>
          </Grid.Row>
        </Grid>
        <br/>
        <p>商户: 哈希森林网络有限公司</p>
        <p>链上地址: {item.details.dataset_link}</p>
        <p>数据总数: 300万条</p>
        <p>数据大小: 2TB</p>
        <p>数据描述: <Label as='a' color='red' size="tiny">仅限TEE</Label> <Label color='green' size="tiny">已上链</Label></p>
        <p style={{color: '#777', fontSize: 12}}>
          {item.details.description}
        </p>
        <p>价格:</p>
        <p style={{color: '#777', fontSize: 12}}>
          计价方式: 按量付费 <br/>
          价格: {parseFloat(item.details.price.PerRow.price)/1e14}元/条
        </p>
      </Card.Content>
    </Card>
  )
}

const Dataset = styled(_Dataset)`
  p {
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const data_items = [
  {
    "details": {
      "category": "征信数据",
      "dataset_link": "/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
      "dataset_preview": "id,phone,name,gender,income2018,income2017,remark\n1001001999010199993333,13010002000,张三,male,500000,450000,备注信息1\n2002002005010188884444,18090007000,李四,female,300000,300000,备注信息2\n",
      "description": "[DEMO]本数据由北京市哈希森林公司合法渠道采集的1万条征信数据，包含用户身份证号、手机号、日常消费记录等30个字段，适用于征信模型训练、结果查询。",
      "name": "北京市征信数据",
      "price": {
        "PerRow": {
          "price": "10000000000000"
        }
      }
    },
    "id": 0,
    "seller": "d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d",
    "txref": {
      "blocknum": 6,
      "index": 1
    }
  }
];

function Items ({ basePath, className, t }: Props): React.ReactElement<Props> | null {
  return (
    <div className={className}>
      <h1>数据商品市场</h1>
      <div>全部 / 我的</div>
      <hr />

      <Grid>
        <Grid.Row columns={3}>
          <Grid.Column>
            数据标题 <Input placeholder='' />
          </Grid.Column>
          <Grid.Column>
            买家名称 <Input placeholder='' />
          </Grid.Column>
          <Grid.Column>
            数据类型 <Input placeholder='' />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row columns={2}>
          <Grid.Column floated='left'>
            <Button primary><Icon name='add' />新建商品</Button>
          </Grid.Column>
          <Grid.Column floated='right' textAlign='right'>
            <Button primary>查询</Button>
            <Button secondary>重置</Button>
          </Grid.Column>
        </Grid.Row>
      </Grid>

      <Grid doubling stackable>{
        data_items.map((i, idx) => (
          <Grid.Column key={idx} width={4}>
            <Dataset item={i} basePath={basePath} />
          </Grid.Column>
        ))
      }</Grid>
    </div>
  )
}

export default Items;