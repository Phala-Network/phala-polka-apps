import { ApiProps } from '@polkadot/react-api/types';
import { I18nProps } from '@polkadot/react-components/types';
import { useDropzone } from 'react-dropzone'

import React, {useCallback} from 'react';
import styled from 'styled-components';
import { Button, Form, Grid, Label, Icon, Input, Select, TextArea } from 'semantic-ui-react';

interface Props extends ApiProps, I18nProps {
}

const categories =  [
  { key: 'c1', value: 'c1', text: '金融征信' },
  { key: 'c2', value: 'c2', text: '语料库' },
  { key: 'c3', value: 'c3', text: '图像' },
  { key: 'c4', value: 'c4', text: '语音' },
];

const accoutingType = [
  { key: 'c1', value: 'c1', text: '按行付费' },
  { key: 'c2', value: 'c2', text: '类别二' },
  { key: 'c3', value: 'c3', text: '类别三' },
];

const getColor = (props: any) => {
  if (props.isDragAccept) {
      return '#00e676';
  }
  if (props.isDragReject) {
      return '#ff1744';
  }
  if (props.isDragActive) {
      return '#2196f3';
  }
  return '#eeeeee';
}

const UploadContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  border-width: 2px;
  border-radius: 2px;
  border-color: ${props => getColor(props)};
  border-style: dashed;
  background-color: #fafafa;
  color: #bdbdbd;
  outline: none;
  transition: border .24s ease-in-out;
  margin-bottom: 10px;
`;

function StepBasic({className, t}: Props): React.ReactElement<Props> | null {
  const onDrop = useCallback(acceptedFiles => {
  }, [])
  const {
    getRootProps, getInputProps,
    isDragActive, isDragAccept, isDragReject
  } = useDropzone({onDrop});

  return (
    <>
      <h2>基本信息</h2>
      <Grid stackable>
        <Grid.Row verticalAlign='middle'>
          <Grid.Column width={2} textAlign='right'>商户名称</Grid.Column>
          <Grid.Column width={6}>
            <Input />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row verticalAlign='middle'>
          <Grid.Column width={2} textAlign='right'>商品名称</Grid.Column>
          <Grid.Column width={6}>
            <Input />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row verticalAlign='middle'>
          <Grid.Column width={2} textAlign='right'>数据品类</Grid.Column>
          <Grid.Column width={6}>
          <Select placeholder='请选择品类' options={categories} />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row verticalAlign='top'>
          <Grid.Column width={2} textAlign='right'>数据文件</Grid.Column>
          <Grid.Column width={6}>
            <UploadContainer {...getRootProps({isDragActive, isDragAccept, isDragReject})}>
              <input {...getInputProps()} />
              {
                isDragActive ?
                  <p>松开上传</p> :
                  <p>将文件拖拽到此处，或点击上传</p>
              }
            </UploadContainer>
            <p>CSV文件，不超过1G</p>
            <p className='text-primary'>您的数据将经过本地加密后才会上传，所有的计算仅在可信执行环境内完成。任何人、程序获取数据都将经由您的代码审核后才能实现。</p>
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Button primary>下一步</Button>
          <Button secondary>取消</Button>
        </Grid.Row>
      </Grid>
    </>
  );
}


function StepDetails({className, t}: Props): React.ReactElement<Props> | null {
  return (
    <>
      <h2>数据信息</h2>
      <Grid>
        <Grid.Row>
          <Grid.Column width={2} textAlign='right'>填写预览数据</Grid.Column>
          <Grid.Column width={10}>
            (show csv header here)
            <Form>
              <TextArea placeholder='预览数据CSV' />
            </Form>
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column width={2} textAlign='right'>计价方式</Grid.Column>
          <Grid.Column width={6}>
            <Select placeholder='请选择' options={accoutingType} />
          </Grid.Column>
          <Grid.Column width={2} textAlign='right'>字段定价</Grid.Column>
          <Grid.Column width={6}>
            (field-wise accouting)
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column width={2} textAlign='right'>确认合约参数</Grid.Column>
          <Grid.Column width={10}>
            <Form>
              <TextArea placeholder='contract json' />
            </Form>
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column width={2} textAlign='right'>填写数据描述</Grid.Column>
          <Grid.Column width={10}>
            (show csv header here)
            <Form>
              <TextArea placeholder='请输入内容' />
            </Form>
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Button primary>发布</Button>
          <Button secondary>返回</Button>
        </Grid.Row>        
      </Grid>
    </>
  );
}


export default function List({className, t}: Props): React.ReactElement<Props> | null {

  return (
    <div className={className}>
      <h1>新建商品</h1>
      <hr/>
      <StepBasic />
      <StepDetails />
    </div>
  )
}