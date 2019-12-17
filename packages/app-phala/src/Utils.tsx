
import React from 'react';
import { Table } from 'semantic-ui-react';

export function genTablePreview (header: Array<string> | null, rows: Array<Array<string>> | null): React.ReactElement {
  if (!header || !rows) {
    return (<div>暂无预览</div>);
  }
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