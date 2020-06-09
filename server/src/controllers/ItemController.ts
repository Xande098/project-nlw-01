import { Request, Response } from 'express';
import knex from '../database/connection';

class ItemController {
    async index(request: Request, response: Response) {
        const item = await knex('item').select('*'); // é a mesma coisa que SELECT * FROM item;
    
        const serializedItens = item.map(item => {
            return {
                id: item.id,
                title: item.title,
                image_url: `http://192.168.100.101:3333/uploads/${item.image}`,
            };
        });
    
        return response.json(serializedItens);
    }
};

export default ItemController;