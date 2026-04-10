const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { AWS_REGION, DYNAMODB_TABLE } = require('./config');

const client = new DynamoDBClient({ region: AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

module.exports = { docClient, TABLE_NAME: DYNAMODB_TABLE };
