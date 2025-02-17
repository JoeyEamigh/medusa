import { Type } from "class-transformer"
import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator"
import { defaultStoreCartFields, defaultStoreCartRelations } from "."
import { CartService } from "../../../../services"
import { AddressPayload } from "../../../../types/common"
import { IsType } from "../../../../utils/validators/is-type"
import { validator } from "../../../../utils/validator"

/**
 * @oas [post] /store/carts/{id}
 * operationId: PostCartsCart
 * summary: Update a Cart"
 * description: "Updates a Cart."
 * parameters:
 *   - (path) id=* {string} The id of the Cart.
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         properties:
 *           region_id:
 *             type: string
 *             description: The id of the Region to create the Cart in.
 *           country_code:
 *             type: string
 *             description: "The 2 character ISO country code to create the Cart in."
 *           email:
 *             type: string
 *             description: "An email to be used on the Cart."
 *           billing_address:
 *             description: "The Address to be used for billing purposes."
 *             anyOf:
 *               - $ref: "#/components/schemas/address"
 *           shipping_address:
 *             description: "The Address to be used for shipping."
 *             anyOf:
 *               - $ref: "#/components/schemas/address"
 *           gift_cards:
 *             description: "An array of Gift Card codes to add to the Cart."
 *             type: array
 *             items:
 *               required:
 *                 - code
 *               properties:
 *                 code:
 *                   description: "The code that a Gift Card is identified by."
 *                   type: string
 *           discounts:
 *             description: "An array of Discount codes to add to the Cart."
 *             type: array
 *             items:
 *               required:
 *                 - code
 *               properties:
 *                 code:
 *                   description: "The code that a Discount is identifed by."
 *                   type: string
 *           customer_id:
 *             description: "The id of the Customer to associate the Cart with."
 *             type: string
 *           context:
 *             description: "An optional object to provide context to the Cart."
 *             type: object
 * tags:
 *   - Cart
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           properties:
 *             cart:
 *               $ref: "#/components/schemas/cart"
 */
export default async (req, res) => {
  const { id } = req.params

  const validated = await validator(StorePostCartsCartReq, req.body)

  const cartService: CartService = req.scope.resolve("cartService")

  // Update the cart
  await cartService.update(id, validated)

  // If the cart has payment sessions update these
  const updated = await cartService.retrieve(id, {
    relations: ["payment_sessions", "shipping_methods"],
  })

  if (updated.payment_sessions?.length && !validated.region_id) {
    await cartService.setPaymentSessions(id)
  }

  const cart = await cartService.retrieve(id, {
    select: defaultStoreCartFields,
    relations: defaultStoreCartRelations,
  })

  res.json({ cart })
}

class GiftCard {
  @IsString()
  code: string
}

class Discount {
  @IsString()
  code: string
}

export class StorePostCartsCartReq {
  @IsOptional()
  @IsString()
  region_id?: string

  @IsOptional()
  @IsString()
  country_code?: string

  @IsEmail()
  @IsOptional()
  email?: string

  @IsOptional()
  @IsType([AddressPayload, String])
  billing_address?: AddressPayload | string

  @IsOptional()
  @IsType([AddressPayload, String])
  shipping_address?: AddressPayload | string

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GiftCard)
  gift_cards?: GiftCard[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Discount)
  discounts?: Discount[]

  @IsString()
  @IsOptional()
  customer_id?: string

  @IsOptional()
  context?: object
}
