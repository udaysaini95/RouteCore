const prisma = require("../src/config/prisma");
const { ConflictError } = require("../utils/error");



const createStation = async (data) => {
    const { code, name, city, state } = data;
    
    const existingStation = prisma.station.findUnique({
        where:{code}
    })

    if (existingStation)
    {
        throw new ConflictError("Station already exists");
    }

    const station = prisma.station.create({
        data
    })

    logger.info("Station Created", { id: station.id, code: station.code });
}