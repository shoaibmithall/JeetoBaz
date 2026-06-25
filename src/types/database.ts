export type Product = {
  id: string;
  name: string;
  price: number;
  status: 'active' | 'completed' | string;
  created_at: string;
  current_entries: number | null;
  max_entries: number;
  entry_fee: number | null;
  winner_phone: string | null;
  image_url?: string | null;
  description?: string | null;
  draw_date?: string | null;
  live_link?: string | null;
  winner_photo?: string | null;
};

export type Entry = {
  id: string;
  product_id: string;
  phone: string;
  created_at: string;
  name?: string | null;
  ticket_number?: string | null;
  transaction_id?: string | null;
};

export type User = {
  id: string;
  name: string | null;
  phone: string;
  created_at: string;
  jazzcash_number?: string | null;
};

export type Transaction = {
  id: string;
  product_id: string;
  phone: string;
  amount: number;
  jazzcash_txn_id: string;
  status: string;
  created_at: string;
  payment_method?: string | null;
  sender_name?: string | null;
  sender_phone?: string | null;
  user_name?: string | null;
  receipt_path?: string | null;
};

export type ProductFormData = {
  name: string;
  price: number;
  entry_fee: number;
  max_entries: number;
  image_url: string | null;
  description: string | null;
  draw_date: string | null;
  live_link: string | null;
  winner_photo: string | null;
};

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      products: Table<
        Product,
        ProductFormData & {
          current_entries?: number | null;
          status?: string;
        },
        Partial<ProductFormData> & Partial<Pick<Product, 'current_entries' | 'status' | 'winner_phone'>>
      >;
      entries: Table<
        Entry,
        Pick<Entry, 'product_id' | 'phone'> &
          Partial<Pick<Entry, 'name' | 'ticket_number' | 'transaction_id'>>
      >;
      users: Table<
        User,
        Pick<User, 'name' | 'phone'> & Partial<Pick<User, 'jazzcash_number'>>
      >;
      transactions: Table<
        Transaction,
        Pick<Transaction, 'product_id' | 'phone' | 'amount' | 'jazzcash_txn_id'> &
          Partial<Pick<Transaction, 'status' | 'payment_method' | 'sender_name' | 'sender_phone' | 'user_name' | 'receipt_path'>>
      >;
    };
    Views: {};
    Functions: {
      increment: {
        Args: { x: number };
        Returns: number;
      };
    };
    Enums: {};
    CompositeTypes: {};
  };
};
