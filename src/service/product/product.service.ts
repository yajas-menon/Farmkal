import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IProduct } from 'src/interface/product.interface';
import { ILocation } from 'src/interface/location.interface';
import Groq from 'groq-sdk';
@Injectable()
export class ProductService {
  private groq = new Groq({
    apiKey: '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',
  });
  constructor(
    @InjectModel('Product') private productModel: Model<IProduct>,
    @InjectModel('Location') private locationModel: Model<ILocation>,
  ) {}

  async createProduct(data: any): Promise<IProduct | any> {
    const {
      categoryId,
      brandId,
      modelId,
      price,
      manufacturingYear,
      userId,
      isActive,
      additionalFields,
      city,
      state,
      country,
    } = data;

    let { locationId } = data;

    if (!locationId) {
      const existingLocation: any = await this.locationModel
        .findOne({
          city: city,
          state: state,
          country: country,
        })
        .catch((err) => {
          console.log(err);
        });

      if (existingLocation) {
        locationId = existingLocation?._id.toString();
      } else {
        const newLocation = {
          city: city,
          state: state,
          country: country,
          isActive: true,
          description: 'City in Rajasthan',
          type: 'City',
          image:
            'https://storage.googleapis.com/farm7-e6457.appspot.com/images/e2f2decf-986f-44b3-9377-dc7e3fbde743-.png',
        };

        const addedLocation = await new this.locationModel(newLocation).save();
        locationId = addedLocation?._id.toString();
      }
    }

    let newProduct: any = {
      categoryId: categoryId,
      userId: userId,
      brandId: brandId,
      locationId: locationId,
      modelId: modelId,
      price: price,
      manufacturingYear: manufacturingYear,
      isActive: isActive,
      additionalFields: additionalFields,
    };

    newProduct = await new this.productModel(newProduct).save();
    return newProduct;
  }

  async getProduct(
    id: string,
    data: any,
  ): Promise<IProduct | IProduct[] | any> {
    const {
      additionalFields,
      price,
      categoryId,
      brandId,
      locationId,
      modelId,
      manufacturingYear,
      isActive,
      userId,
    } = data;

    const obj: any = {};

    if (id) {
      obj._id = id;
    }

    if (additionalFields) {
      obj.additionalFields = additionalFields;
    }

    if (price) {
      obj.price = price;
    }

    if (categoryId) {
      obj.categoryId = categoryId;
    }

    if (brandId) {
      obj.brandId = brandId;
    }

    if (isActive || isActive === false) {
      obj.isActive = isActive;
    }

    if (modelId) {
      obj.modelId = modelId;
    }

    if (manufacturingYear) {
      obj.manufacturingYear = manufacturingYear;
    }

    if (locationId) {
      obj.locationId = locationId;
    }

    if (userId) {
      obj.userId = userId;
    }

    const products: any = await this.productModel
      .aggregate([
        {
          $addFields: {
            categoryId: { $toObjectId: '$categoryId' },
            brandId: { $toObjectId: '$brandId' },
            locationId: { $toObjectId: '$locationId' },
            modelId: { $toObjectId: '$modelId' },
            userId: { $toObjectId: '$userId' },
            productID: { $toString: '$_id' },
          },
        },
        {
          $lookup: {
            from: 'productimages',
            localField: 'productID',
            foreignField: 'productId',
            as: 'productImages',
          },
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'categoryDetails',
          },
        },
        {
          $unwind: '$categoryDetails',
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brandId',
            foreignField: '_id',
            as: 'brandDetails',
          },
        },
        {
          $unwind: '$brandDetails',
        },
        {
          $lookup: {
            from: 'locations',
            localField: 'locationId',
            foreignField: '_id',
            as: 'locationDetails',
          },
        },
        {
          $unwind: '$locationDetails',
        },
        {
          $lookup: {
            from: 'models',
            localField: 'modelId',
            foreignField: '_id',
            as: 'modelDetails',
          },
        },
        {
          $unwind: '$modelDetails',
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'userDetails',
          },
        },
        {
          $unwind: '$userDetails',
        },
        {
          $project: {
            price: 1,
            manufacturingYear: 1,
            isActive: 1,
            additionalFields: 1,
            categoryDetails: 1,
            brandDetails: 1,
            locationDetails: 1,
            modelDetails: 1,
            userDetails: 1,
            productImages: 1,
          },
        },
      ])
      .exec()
      .catch((err) => {
        console.log(err);
      });

    return products;
  }

  async updateProduct(
    id: string,
    data: any,
  ): Promise<IProduct | IProduct[] | any> {
    const {
      additionalFields,
      price,
      categoryId,
      brandId,
      locationId,
      modelId,
      manufacturingYear,
      isActive,
      userId,
    } = data;

    const obj: any = {};

    if (additionalFields) {
      obj.additionalFields = additionalFields;
    }

    if (price) {
      obj.price = price;
    }

    if (categoryId) {
      obj.categoryId = categoryId;
    }

    if (brandId) {
      obj.brandId = brandId;
    }

    if (isActive) {
      obj.isActive = isActive;
    }

    if (modelId) {
      obj.modelId = modelId;
    }

    if (userId) {
      obj.userId = userId;
    }

    if (manufacturingYear) {
      obj.manufacturingYear = manufacturingYear;
    }

    if (locationId) {
      obj.locationId = locationId;
    }

    const updatedProduct = await this.productModel
      .findOneAndUpdate({ _id: id }, { $set: obj }, { new: true })
      .exec()
      .catch((err) => {
        console.log(err);
      });

    return updatedProduct;
  }

  async getChatResponse(data: any): Promise<any> {
    const { prompt } = data;
    try {
      const chatCompletion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'mixtral-8x7b-32768',
        temperature: 1,
        max_tokens: 1024,
        top_p: 1,
        stream: true,
        stop: null,
      });

      let finalData = '';

      for await (const chunk of chatCompletion) {
        finalData += chunk.choices[0]?.delta?.content;
        // process.stdout.write(chunk.choices[0]?.delta?.content || '');
      }

      return finalData;
    } catch (error) {
      console.error(error);
      throw new Error(
        `Error fetching data from Hugging Face API: ${error.message}`,
      );
    }
  }
}
