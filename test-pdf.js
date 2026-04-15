import React from 'react';
import ReactPDF, { Document, Page, Text, View } from '@react-pdf/renderer';

const TestDoc = () => (
  <Document>
    <Page>
      <View style={{ margin: 50 }}>
        <Text style={{ fontSize: 12 }}>
          Unicode: H₂O
        </Text>
        <Text style={{ fontSize: 12, marginTop: 10 }}>
          Nested Baseline: H<Text style={{ fontSize: 8 }}>2</Text>O
        </Text>
      </View>
    </Page>
  </Document>
);

ReactPDF.render(<TestDoc />, 'test.pdf').catch(console.error);
