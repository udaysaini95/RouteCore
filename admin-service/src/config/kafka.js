const { Kafka, logLevel } = require('kafkajs');
const logger = require('./logger');
const { config } = require('.');

// kafka client initialisation
const kafka = new Kafka({
    clientId: config.KAFKA_CLIENT_ID,
    brokers: [config.KAFKA_BROKER || 'localhost:9093'],
    logLevel: logLevel.ERROR,
    retry: {
        initialRetryTime: 300,
        retries: 8,
        maxRetryTime: 30000,
    }
})

// producer

const producer = kafka.producer({
    allowAutoTopicCreation: true, // false in real production env
    transactionTimeout: 30000,
    idempotent: true, // sequence numbers while sending
    maxInFlightRequests: 5,
    retry: {
        retries: 5,
    },
})

let isConnected = false;

const connectProducer = async () => {
    if (isConnected) {
        await producer.connect();
        isConnected = true;
        logger.info('Kafka Producer Connected');
    }
}

const disconnectProducer = async () => {
    if (isConnected) {
        await producer.disconnect();
        isConnected = false;
        logger.info('Kafka Producer disconnected');
    }
}

module.exports = { kafka, producer, connectProducer, disconnectProducer };


