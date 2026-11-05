const { consumer } = require("../../config/kafka");
const emailService = require("../../services/email.service");
const logger = require("../../config/logger");
const { KAFKA_TOPICS } = require("../../../../shared/constants/kafka-topics");

class EmailConsumer {
  async start() {
    try {
      await consumer.connect();
      logger.info("Email consumer connected to Kafka");

      // Subscribe only to OTP and Welcome topics
      await consumer.subscribe({
        topics: [KAFKA_TOPICS.OTP_EMAIL, KAFKA_TOPICS.WELCOME_EMAIL],
        fromBeginning: false,
      });

      // Standard KafkaJS message handler without DLQ
      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const rawValue = message.value.toString();
            const data = JSON.parse(rawValue);
            logger.info(`Received message from topic: ${topic}`);

            await this.handleMessage(topic, data);
          } catch (err) {
            logger.error(`Error processing message from topic ${topic}`, {
              error: err.message,
              offset: message.offset,
            });
          }
        },
      });

      logger.info("Email consumer is running and listening for messages...");
    } catch (error) {
      logger.error("Failed to start email consumer", { error: error.message });
      throw error;
    }
  }

  async handleMessage(topic, data) {
    switch (topic) {
      case KAFKA_TOPICS.OTP_EMAIL:
        await this.handleOtpEmail(data);
        break;

      case KAFKA_TOPICS.WELCOME_EMAIL:
        await this.handleWelcomeEmail(data);
        break;

      default:
        logger.warn(`Unknown topic: ${topic}`);
    }
  }

  async handleOtpEmail(data) {
    const { email, otp, ttlMinutes } = data;
    if (!email || !otp)
      throw new Error("Missing required fields: email or otp");

    await emailService.sendOtpEmail(email, otp, ttlMinutes || 5);
    logger.info(`OTP email sent to ${email}`);
  }

  async handleWelcomeEmail(data) {
    const { email, firstName } = data;
    if (!email || !firstName)
      throw new Error("Missing required fields: email or firstName");

    await emailService.sendWelcomeEmail(email, firstName);
    logger.info(`Welcome email sent to ${email}`);
  }

  async stop() {
    await consumer.disconnect();
    logger.info("Email consumer disconnected");
  }
}

module.exports = new EmailConsumer();
