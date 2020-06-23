import { Request, Response } from 'express';
import knex from '../database/connection';

class PointController {
    async index(request: Request, response: Response) {
        const { city, uf, item } = request.query;

        const parsedItens = String(item)
            .split(',')
            .map(item => Number(item.trim()));

        const points = await knex('point')
            .join('point_item', 'point.id', '=', 'point_item.point_id')
            .whereIn('point_item.item_id', parsedItens)
            .where('city', String(city))
            .where('uf', String(uf))
            .distinct()
            .select('point.*');

        const serializedPoints = points.map(point => {
            return {
                ...point,
                image_url: `http://192.168.100.101:3333/uploads/${point.image}`,
            };
        });

        return response.json(serializedPoints);
    }

    async show(request: Request, response: Response) {
        const { id } = request.params;

        const points = await knex('point').where('id', id).first();

        if (!points) {
            return response.status(400).json({ message: 'Point not found.' })
        }

        /**
         * SELECT * FROM item
         *  JOIN point_item on item.id = point_item.item_id
         * WHERE point_item.point_id = {id};
         */

        const serializedPoint = {
            ...points,
            image_url: `http://192.168.100.101:3333/uploads/${points.image}`,
        };

        const itens = await knex('item')
            .join('point_item', 'item.id', '=', 'point_item.item_id')
            .where('point_item.point_id', id)
            .select('item.title');

        return response.json({ points: serializedPoint, itens });
    }

    async create(request: Request, response: Response) {
        const {
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf,
            item
        } = request.body;

        const trx = await knex.transaction();

        const points = {
            image: request.file.filename,
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf
        }

        const isertedIds = await trx('point').insert(points);

        const point_id = isertedIds[0];

        const pointItem = item
            .split(',')
            .map((item: string) => Number(item.trim()))
            .map((item_id: number) => {
                return {
                    item_id,
                    point_id,
                };
            });

        await trx('point_item').insert(pointItem);

        await trx.commit();

        return response.json({
            id: point_id,
            ...points,
        });
    }
};

export default PointController;
