const inventoryService = require("../services/inventoryService");

async function getInventory(req, res) {

    try {

        const items = await inventoryService.getInventory(req.user.id);

        res.json(items);

    } catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Failed to fetch inventory",

        });

    }

}

async function createInventoryItem(req, res) {

    try {

        const {

            name,

            quantity,

            price,

        } = req.body;

        const item = await inventoryService.createInventoryItem(

            name,

            quantity,

            price,

            req.user.id

        );

        res.status(201).json(item);

    } catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Failed to create inventory item",

        });

    }

}

async function updateInventoryItem(req, res) {

    try {

        const id = Number(req.params.id);

        const {

            name,

            quantity,

            price,

        } = req.body;

        const item = await inventoryService.updateInventoryItem(

            id,

            req.user.id,

            name,

            quantity,

            price

        );

        if (!item) {

            return res.status(404).json({

                message: "Inventory item not found",

            });

        }

        res.json(item);

    } catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Failed to update inventory item",

        });

    }

}

async function deleteInventoryItem(req, res) {

    try {

        const id = Number(req.params.id);

        const deleted = await inventoryService.deleteInventoryItem(id, req.user.id);

        if (deleted.count === 0) {

            return res.status(404).json({

                message: "Inventory item not found",

            });

        }

        res.json({

            message: "Inventory item deleted",

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Failed to delete inventory item",

        });

    }

}

module.exports = {

    getInventory,

    createInventoryItem,

    updateInventoryItem,

    deleteInventoryItem,

};
