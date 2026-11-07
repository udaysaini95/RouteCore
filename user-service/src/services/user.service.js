const logger = require("../config/logger");


const getProfile = async (userId) => {
    // first check in redis
    logger.info("First checking in redis");
    const storedUser = await redis.get(`user:${userId}`);
    // we dont have to error if not found in redis
    // if (!storedUser)
    // {
    //     throw new 
    // }
    
    if (storedUser)
    {
        logger.info("User found in redis");
        // stringified while storing
        // parse while getting
        return JSON.parse(storedUser);
    }

    // check db
    logger.info("checking in db")
    const userProfile = await prisma.user.findUnique({
        where: {
            id:userId
        }
    })

    // remove password and store in redis
    const { password: _password, ...safeUser } = userProfile;
    logger.info("storing in redis");
    await redis.set(
      `user:${userId}`,
      JSON.stringify(safeUser),
      "EX",
      config.REDIS_USER_TTL,
    );

    // return userProfile; it also contains password
    return safeUser;
}

module.exports = { getProfile };
