import { ImageSourcePropType } from "react-native";

export type ProductId = "white-shirt" | "black-shirt" | "black-mug" | "black-cap" | "black-buff";

export interface MerchProduct {
  id: ProductId;
  images: ImageSourcePropType[];
  hasSize: boolean;
  price: number;
}

export const MERCH_PRODUCTS: MerchProduct[] = [
  {
    id: "white-shirt",
    images: [
      require("@/assets/images/merch/white-shirt-1.jpeg"),
      require("@/assets/images/merch/white-shirt-2.jpeg"),
    ],
    hasSize: true,
    price: 45,
  },
  {
    id: "black-shirt",
    images: [require("@/assets/images/merch/black-shirt.jpg")],
    hasSize: true,
    price: 45,
  },
  {
    id: "black-mug",
    images: [require("@/assets/images/merch/black-mug.jpg")],
    hasSize: false,
    price: 20,
  },
  {
    id: "black-cap",
    images: [require("@/assets/images/merch/cap.jpg")],
    hasSize: false,
    price: 30,
  },
  {
    id: "black-buff",
    images: [require("@/assets/images/merch/buff.png")],
    hasSize: false,
    price: 30,
  },
];

export const VALID_PRODUCT_IDS: ProductId[] = MERCH_PRODUCTS.map((p) => p.id);
