import { ApiProps } from '@polkadot/react-api/types';
import { I18nProps } from '@polkadot/react-components/types';
import { Modal, Button as PButton, TxButton, InputAddress } from '@polkadot/react-components';

import React, {useEffect, useState, useCallback, useMemo} from 'react';
import { useHistory, useParams } from "react-router-dom";
import { useDropzone } from 'react-dropzone'
import { Button, Form, Grid, Header, Input, Label, TextArea, Table } from 'semantic-ui-react';
import * as Papa from 'papaparse';

import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import monokai from 'react-syntax-highlighter/dist/esm/styles/hljs/monokai';

import { UploadContainer, genDataLabels, genTablePreview, fileToIpfsPath } from './common/Utils';
import { Item, defaultItem, CsvTablePreview, fmtAmount } from './common/Models'
import { getItem } from './API';

import imgIpfsSvg from './assets/ipfs-logo-vector-ice-text.svg';

interface Props {
  basePath: string;
  accountId: string | null;
}

export default function NewOrder({basePath, accountId}: Props): React.ReactElement<Props> | null {
  const history = useHistory();
  useEffect(() => {
    if (!accountId) {
      history.push(`${basePath}/account`);
    }
  }, [accountId]);

  // items

  const { value } = useParams();
  const [item, setItem] = useState<Item>(defaultItem());

  useEffect(()=> {
    (async () => {
      const resultItem = await getItem(parseInt(value!));
      setItem(resultItem);
    })();
  }, [value]);

  // drop

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles.length == 0) {
      return;
    }
    const file = acceptedFiles[0];
    setCsvFile(file);
  }, [])

  const {
    getRootProps, getInputProps,
    isDragActive, isDragAccept, isDragReject
  } = useDropzone({onDrop});

  useEffect(() => {
    if (!csvFile) return;
    (async () => {
      const ipfsPath = await fileToIpfsPath(csvFile);
      setPushCommandParams((p) => {
        const newp = {...p};
        newp.OpenOrder.query_link = ipfsPath;
        return newp;
      });

      Papa.parse(csvFile, {
        complete: function (dataset) {
          const header = dataset.data[0];
          const rows = dataset.data.slice(1, 10);
          setTablePreview({header, rows})
        }
      })
    })();
  }, [csvFile])

  // preview

  const [tablePreview, setTablePreview] = useState<CsvTablePreview>({
    header: null,
    rows: null
  });

  // submit

  function handleCancel () {
    history.goBack();
  }

  const [pushCommandParams, setPushCommandParams] = useState({
    OpenOrder: {
      item_id: parseInt(value!),
      query_link: ''
    }
  });
  const contractParams = useMemo(() => {
    return `Execution.push_command(ContractMarketplace, ${JSON.stringify(pushCommandParams, undefined, 2)})`;
  }, [pushCommandParams])

  const [submitTxOpen, setSubmitTxOpen] = useState<boolean>(false);
  function handleSubmitTx () {
    // TODO: construct pushCommand
    setSubmitTxOpen(true);
  }
  function onClose() {
    setSubmitTxOpen(false);
  }

  return (
    <div>
      <h1>购买商品</h1>
      <hr/>

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
      <Grid>
        <Grid.Row verticalAlign='top'>
            <Grid.Column width={2} textAlign='right'>查询文件</Grid.Column>
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
      </Grid>

      <h2>请求数据</h2>
      <Grid>
        <Grid.Row>
          <Grid.Column width={2} textAlign='right'>请求数据</Grid.Column>
          <Grid.Column width={10}>
            {genTablePreview(tablePreview.header, tablePreview.rows)}
            {pushCommandParams.OpenOrder.query_link && (
              <>
                <img src={imgIpfsSvg} className="icon ipfs" /> {pushCommandParams.OpenOrder.query_link}
              </>
            )}
          </Grid.Column>
        </Grid.Row>
        <Grid.Row verticalAlign='top'>
          <Grid.Column width={2} textAlign='right'>字段关联</Grid.Column>
          <Grid.Column width={10}>
              <SyntaxHighlighter language='sql' style={monokai} showLineNumbers>
                SELECT *
                FROM query JOIN dataset on (query.phone == dataset.phone)
              </SyntaxHighlighter>
            <pre>

            </pre>
          </Grid.Column>
        </Grid.Row>
        <Grid.Row verticalAlign='top'>
          <Grid.Column width={2} textAlign='right'>合约参数预览</Grid.Column>
          <Grid.Column width={10}>
            <SyntaxHighlighter language='javascript' style={monokai} showLineNumbers>
                {contractParams}
              </SyntaxHighlighter>
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column width={2} textAlign='right'>选择可信矿工</Grid.Column>
          <Grid.Column width={10}>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>矿工地址</Table.HeaderCell>
                  <Table.HeaderCell>相对算力</Table.HeaderCell>
                  <Table.HeaderCell>价格</Table.HeaderCell>
                  <Table.HeaderCell>节点状态</Table.HeaderCell>
                  <Table.HeaderCell>操作</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                <Table.Row>
                  <Table.Cell>102.8.75.3</Table.Cell>
                  <Table.Cell>2.0x</Table.Cell>
                  <Table.Cell>-</Table.Cell>
                  <Table.Cell><Label color='green'>在线</Label></Table.Cell>
                  <Table.Cell><Label color='grey'>已选择</Label></Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell>43.219.62.220</Table.Cell>
                  <Table.Cell>1.5x</Table.Cell>
                  <Table.Cell>-</Table.Cell>
                  <Table.Cell><Label color='yellow'>离线</Label></Table.Cell>
                  <Table.Cell></Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell>18.21.5.102</Table.Cell>
                  <Table.Cell>1.5x</Table.Cell>
                  <Table.Cell>-</Table.Cell>
                  <Table.Cell><Label color='yellow'>离线</Label></Table.Cell>
                  <Table.Cell></Table.Cell>
                </Table.Row>
              </Table.Body>
            </Table>
          </Grid.Column>
        </Grid.Row>

        <Grid.Row>
          <Button primary onClick={handleSubmitTx}>下一步</Button>
          <Button secondary onClick={handleCancel}>返回</Button>
        </Grid.Row>
      </Grid>


      <Modal open={submitTxOpen} header='提交合约请求'>
        <Modal.Content>
          <InputAddress
            className='medium'
            defaultValue={accountId}
            isDisabled
            label='账号'
          />
        </Modal.Content>
        <Modal.Actions>
          <PButton.Group>
            <PButton
              icon='cancel'
              isNegative
              label='取消'
              onClick={onClose}
            />
            <PButton.Or />
            <TxButton
              accountId={accountId}
              icon='send'
              label='提交'
              params={[1, JSON.stringify(pushCommandParams)]}
              tx='execution.pushCommand'
            />
          </PButton.Group>
        </Modal.Actions>
      </Modal>
    </div>
  )
}