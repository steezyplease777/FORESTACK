export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      app_companies: {
        Row: {
          created_at: string
          custom_portal_theme: boolean
          custom_theme_portal: boolean
          id: string
          internal_code_prefix: string | null
          logo_url: string | null
          name: string
          organization_id: string
          portal_theme: Json | null
          primary_color_hex: string | null
          secondary_color_hex: string | null
          slug: string | null
          website_url: string | null
        }
        Insert: {
          created_at?: string
          custom_portal_theme?: boolean
          custom_theme_portal?: boolean
          id?: string
          internal_code_prefix?: string | null
          logo_url?: string | null
          name: string
          organization_id: string
          portal_theme?: Json | null
          primary_color_hex?: string | null
          secondary_color_hex?: string | null
          slug?: string | null
          website_url?: string | null
        }
        Update: {
          created_at?: string
          custom_portal_theme?: boolean
          custom_theme_portal?: boolean
          id?: string
          internal_code_prefix?: string | null
          logo_url?: string | null
          name?: string
          organization_id?: string
          portal_theme?: Json | null
          primary_color_hex?: string | null
          secondary_color_hex?: string | null
          slug?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_companies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "app_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      app_company_data_source_accounts: {
        Row: {
          configuration_data: Json | null
          created_at: string
          datasource_id: string
          id: string
          integration_object_id: string
          webhook_config: Json | null
        }
        Insert: {
          configuration_data?: Json | null
          created_at?: string
          datasource_id: string
          id?: string
          integration_object_id: string
          webhook_config?: Json | null
        }
        Update: {
          configuration_data?: Json | null
          created_at?: string
          datasource_id?: string
          id?: string
          integration_object_id?: string
          webhook_config?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "app_company_data_source_configuration_datasource_id_fkey"
            columns: ["datasource_id"]
            isOneToOne: false
            referencedRelation: "app_company_data_source_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_company_integration_configuratio_integration_object_id_fkey"
            columns: ["integration_object_id"]
            isOneToOne: false
            referencedRelation: "app_data_source_objects"
            referencedColumns: ["id"]
          },
        ]
      }
      app_company_data_source_subscriptions: {
        Row: {
          authentication: Database["public"]["Enums"]["AUTHENTICTION METHODS"]
          company_id: string
          connection_name: string
          connection_settings: Json
          created_at: string
          id: string
          integration_id: string
        }
        Insert: {
          authentication?: Database["public"]["Enums"]["AUTHENTICTION METHODS"]
          company_id: string
          connection_name: string
          connection_settings: Json
          created_at?: string
          id?: string
          integration_id: string
        }
        Update: {
          authentication?: Database["public"]["Enums"]["AUTHENTICTION METHODS"]
          company_id?: string
          connection_name?: string
          connection_settings?: Json
          created_at?: string
          id?: string
          integration_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_company_integrations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_company_integrations_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "app_data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      app_company_department_titles: {
        Row: {
          company_id: string
          created_at: string
          department_id: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          department_id: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          department_id?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_company_department_titles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_company_department_titles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "app_company_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      app_company_departments: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_company_departments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      app_company_roles: {
        Row: {
          company_id: string
          created_at: string
          id: string
          key: string
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          key: string
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          key?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_company_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      app_company_users: {
        Row: {
          company_id: string
          created_at: string
          department_title_id: string | null
          id: string
          last_seen: string | null
          org_user_id: string
          role_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          department_title_id?: string | null
          id?: string
          last_seen?: string | null
          org_user_id: string
          role_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          department_title_id?: string | null
          id?: string
          last_seen?: string | null
          org_user_id?: string
          role_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_company_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_company_users_department_title_id_fkey"
            columns: ["department_title_id"]
            isOneToOne: false
            referencedRelation: "app_company_department_titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_company_users_org_user_id_fkey"
            columns: ["org_user_id"]
            isOneToOne: false
            referencedRelation: "app_organization_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_company_users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "app_company_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_data_source_objects: {
        Row: {
          created_at: string
          description: string | null
          graphql_query: string | null
          id: string
          integration_id: string
          integration_scopes: Json | null
          integration_sync_modules: Json | null
          object_id: string
          webhook: Json | null
          webhook_set_up: Json | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          graphql_query?: string | null
          id?: string
          integration_id: string
          integration_scopes?: Json | null
          integration_sync_modules?: Json | null
          object_id: string
          webhook?: Json | null
          webhook_set_up?: Json | null
        }
        Update: {
          created_at?: string
          description?: string | null
          graphql_query?: string | null
          id?: string
          integration_id?: string
          integration_scopes?: Json | null
          integration_sync_modules?: Json | null
          object_id?: string
          webhook?: Json | null
          webhook_set_up?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "app_integration_objects_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "app_data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_integration_objects_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "app_objects"
            referencedColumns: ["id"]
          },
        ]
      }
      app_data_sources: {
        Row: {
          authentication:
            | Database["public"]["Enums"]["AUTHENTICTION METHODS"]
            | null
          connection_config_set_up: Json | null
          connection_type:
            | Database["public"]["Enums"]["DATASOURCE CONNECTION TYPE"]
            | null
          created_at: string
          description: string | null
          id: string
          integration_image_url: string | null
          name: string
        }
        Insert: {
          authentication?:
            | Database["public"]["Enums"]["AUTHENTICTION METHODS"]
            | null
          connection_config_set_up?: Json | null
          connection_type?:
            | Database["public"]["Enums"]["DATASOURCE CONNECTION TYPE"]
            | null
          created_at?: string
          description?: string | null
          id?: string
          integration_image_url?: string | null
          name: string
        }
        Update: {
          authentication?:
            | Database["public"]["Enums"]["AUTHENTICTION METHODS"]
            | null
          connection_config_set_up?: Json | null
          connection_type?:
            | Database["public"]["Enums"]["DATASOURCE CONNECTION TYPE"]
            | null
          created_at?: string
          description?: string | null
          id?: string
          integration_image_url?: string | null
          name?: string
        }
        Relationships: []
      }
      app_modules: {
        Row: {
          created_at: string
          description: string | null
          id: string
          module_code: string | null
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          module_code?: string | null
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          module_code?: string | null
          name?: string
        }
        Relationships: []
      }
      app_objects: {
        Row: {
          app_module_id: string
          bucket_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          object_file_storage_key: string | null
        }
        Insert: {
          app_module_id: string
          bucket_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          object_file_storage_key?: string | null
        }
        Update: {
          app_module_id?: string
          bucket_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          object_file_storage_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_objects_app_module_id_fkey"
            columns: ["app_module_id"]
            isOneToOne: false
            referencedRelation: "app_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      app_organization_users: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          organization_id: string
          phone: string | null
          profile_picture_url: string | null
          role: Database["public"]["Enums"]["organization_roles"] | null
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          organization_id: string
          phone?: string | null
          profile_picture_url?: string | null
          role?: Database["public"]["Enums"]["organization_roles"] | null
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          organization_id?: string
          phone?: string | null
          profile_picture_url?: string | null
          role?: Database["public"]["Enums"]["organization_roles"] | null
        }
        Relationships: [
          {
            foreignKeyName: "app_organization_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "app_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      app_organizations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          logo_url: string | null
          name: string
          personal_org: boolean
          slug: string | null
          subdomain: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          logo_url?: string | null
          name: string
          personal_org?: boolean
          slug?: string | null
          subdomain?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          personal_org?: boolean
          slug?: string | null
          subdomain?: string | null
        }
        Relationships: []
      }
      app_user_profiles: {
        Row: {
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          last_seen: string | null
          profile_picture_url: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          last_seen?: string | null
          profile_picture_url?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          last_seen?: string | null
          profile_picture_url?: string | null
        }
        Relationships: []
      }
      crm_addresses: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          city: string | null
          company_id: string | null
          country: string | null
          created_at: string
          customer_id: string | null
          email: string | null
          id: string
          name: string | null
          phone: string | null
          postal_code: string | null
          state: string | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          company_id?: string | null
          country?: string | null
          created_at?: string
          customer_id?: string | null
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          company_id?: string | null
          country?: string | null
          created_at?: string
          customer_id?: string | null
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_customer_addresses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_allocation_order: {
        Row: {
          cancel_date: string | null
          company_id: string
          created_at: string
          created_by: string | null
          crm_company_id: string
          id: string
          notes: string | null
          ship_date: string
        }
        Insert: {
          cancel_date?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          crm_company_id: string
          id?: string
          notes?: string | null
          ship_date: string
        }
        Update: {
          cancel_date?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          crm_company_id?: string
          id?: string
          notes?: string | null
          ship_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_allocation_order_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_allocation_order_created_by_profile_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_allocation_order_crm_company_id_fkey"
            columns: ["crm_company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_allocation_order_lines: {
        Row: {
          created_at: string
          erp_purchase_order_line_allocation_id: string
          id: string
          quantity: number
          wms_order_line: string
        }
        Insert: {
          created_at?: string
          erp_purchase_order_line_allocation_id: string
          id?: string
          quantity: number
          wms_order_line?: string
        }
        Update: {
          created_at?: string
          erp_purchase_order_line_allocation_id?: string
          id?: string
          quantity?: number
          wms_order_line?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_allocation_order_lines_erp_purchase_order_line_allocat_fkey"
            columns: ["erp_purchase_order_line_allocation_id"]
            isOneToOne: false
            referencedRelation: "erp_purchase_order_line_allocations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_allocation_order_lines_erp_purchase_order_line_allocat_fkey"
            columns: ["erp_purchase_order_line_allocation_id"]
            isOneToOne: false
            referencedRelation: "v_po_line_allocations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_allocation_order_lines_wms_order_line_fkey"
            columns: ["wms_order_line"]
            isOneToOne: false
            referencedRelation: "wms_order_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_companies: {
        Row: {
          app_index: number
          billing_area_code: string | null
          billing_city: string | null
          billing_country_code: string | null
          billing_email: string | null
          billing_phone: string | null
          billing_street_1: string | null
          billing_street_2: string | null
          billing_zip: string | null
          company_code: string | null
          company_id: string
          created_at: string
          id: string
          name: string
          notes: string | null
          sales_channel_id: string
          temp_external_id: string | null
        }
        Insert: {
          app_index: number
          billing_area_code?: string | null
          billing_city?: string | null
          billing_country_code?: string | null
          billing_email?: string | null
          billing_phone?: string | null
          billing_street_1?: string | null
          billing_street_2?: string | null
          billing_zip?: string | null
          company_code?: string | null
          company_id: string
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          sales_channel_id: string
          temp_external_id?: string | null
        }
        Update: {
          app_index?: number
          billing_area_code?: string | null
          billing_city?: string | null
          billing_country_code?: string | null
          billing_email?: string | null
          billing_phone?: string | null
          billing_street_1?: string | null
          billing_street_2?: string | null
          billing_zip?: string | null
          company_code?: string | null
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          sales_channel_id?: string
          temp_external_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_companies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_companies_sales_channel_id_fkey"
            columns: ["sales_channel_id"]
            isOneToOne: false
            referencedRelation: "erp_sales_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_company_document_types: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          mime_type: Database["public"]["Enums"]["mime_type"] | null
          name: string | null
          template_document_path: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          mime_type?: Database["public"]["Enums"]["mime_type"] | null
          name?: string | null
          template_document_path?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          mime_type?: Database["public"]["Enums"]["mime_type"] | null
          name?: string | null
          template_document_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_company_document_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_company_documents: {
        Row: {
          company_id: string
          created_at: string | null
          crm_company_id: string
          document_mime_type: Database["public"]["Enums"]["mime_type"]
          document_name: string | null
          document_path: string | null
          document_size: number | null
          document_type_id: string
          id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          crm_company_id: string
          document_mime_type: Database["public"]["Enums"]["mime_type"]
          document_name?: string | null
          document_path?: string | null
          document_size?: number | null
          document_type_id: string
          id?: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          crm_company_id?: string
          document_mime_type?: Database["public"]["Enums"]["mime_type"]
          document_name?: string | null
          document_path?: string | null
          document_size?: number | null
          document_type_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_company_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_company_documents_crm_company_id_fkey"
            columns: ["crm_company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_company_documents_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "crm_company_document_types"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_company_locations: {
        Row: {
          app_index: number
          assigned_code: string | null
          company_id: string
          created_at: string
          crm_company_id: string
          email: string | null
          id: string
          location_code: string | null
          location_type: Database["public"]["Enums"]["company_location_types"]
          name: string
          phone: string | null
          shipping_area_code: string | null
          shipping_city: string | null
          shipping_country_code: string | null
          shipping_street_1: string | null
          shipping_street_2: string | null
          shipping_zip: string | null
          temp_external_id: string | null
        }
        Insert: {
          app_index: number
          assigned_code?: string | null
          company_id: string
          created_at?: string
          crm_company_id: string
          email?: string | null
          id?: string
          location_code?: string | null
          location_type?: Database["public"]["Enums"]["company_location_types"]
          name: string
          phone?: string | null
          shipping_area_code?: string | null
          shipping_city?: string | null
          shipping_country_code?: string | null
          shipping_street_1?: string | null
          shipping_street_2?: string | null
          shipping_zip?: string | null
          temp_external_id?: string | null
        }
        Update: {
          app_index?: number
          assigned_code?: string | null
          company_id?: string
          created_at?: string
          crm_company_id?: string
          email?: string | null
          id?: string
          location_code?: string | null
          location_type?: Database["public"]["Enums"]["company_location_types"]
          name?: string
          phone?: string | null
          shipping_area_code?: string | null
          shipping_city?: string | null
          shipping_country_code?: string | null
          shipping_street_1?: string | null
          shipping_street_2?: string | null
          shipping_zip?: string | null
          temp_external_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_company_locations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_company_locations_crm_company_id_fkey"
            columns: ["crm_company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_customers: {
        Row: {
          address: string
          city: string
          company_id: string
          country: string
          created_at: string
          datasource_id: string
          email: string
          external_id: string | null
          first_name: string
          id: string
          last_name: string | null
          phone: string
          state: string
          zip: string
        }
        Insert: {
          address: string
          city: string
          company_id: string
          country: string
          created_at?: string
          datasource_id?: string
          email: string
          external_id?: string | null
          first_name: string
          id?: string
          last_name?: string | null
          phone: string
          state: string
          zip: string
        }
        Update: {
          address?: string
          city?: string
          company_id?: string
          country?: string
          created_at?: string
          datasource_id?: string
          email?: string
          external_id?: string | null
          first_name?: string
          id?: string
          last_name?: string | null
          phone?: string
          state?: string
          zip?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_customers_datasource_id_fkey"
            columns: ["datasource_id"]
            isOneToOne: false
            referencedRelation: "app_company_data_source_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_product_channels: {
        Row: {
          company_id: string
          created_at: string
          id: string
          msrp_margin: number
          product_id: string | null
          sales_channel_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          msrp_margin?: number
          product_id?: string | null
          sales_channel_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          msrp_margin?: number
          product_id?: string | null
          sales_channel_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_product_channels_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_product_channels_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "api_product"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_product_channels_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "plm_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_product_channels_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_erp_purchase_order_product_progress"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "erp_product_channels_sales_channel_id_fkey"
            columns: ["sales_channel_id"]
            isOneToOne: false
            referencedRelation: "erp_sales_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_purchase_order_line_allocations: {
        Row: {
          created_at: string
          id: string
          purchase_order_line_id: string
          quantity: number
          sales_channel_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          purchase_order_line_id: string
          quantity: number
          sales_channel_id: string
        }
        Update: {
          created_at?: string
          id?: string
          purchase_order_line_id?: string
          quantity?: number
          sales_channel_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_purchase_order_line_allocations_purchase_order_line_id_fkey"
            columns: ["purchase_order_line_id"]
            isOneToOne: false
            referencedRelation: "erp_purchase_order_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_purchase_order_line_allocations_sales_channel_id_fkey1"
            columns: ["sales_channel_id"]
            isOneToOne: false
            referencedRelation: "erp_purchase_order_sales_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_purchase_order_line_allocations_sales_channel_id_fkey1"
            columns: ["sales_channel_id"]
            isOneToOne: false
            referencedRelation: "v_erp_purchase_order_sales_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_purchase_order_lines: {
        Row: {
          created_at: string
          data_source_id: string | null
          id: string
          in_transit: number | null
          moq_type: string | null
          moq_value: number | null
          product_variant_id: string
          purchase_order_id: string
          quantity: number
          received_quantity: number
          sku: string | null
          unit_cost: number
        }
        Insert: {
          created_at?: string
          data_source_id?: string | null
          id?: string
          in_transit?: number | null
          moq_type?: string | null
          moq_value?: number | null
          product_variant_id: string
          purchase_order_id: string
          quantity: number
          received_quantity: number
          sku?: string | null
          unit_cost: number
        }
        Update: {
          created_at?: string
          data_source_id?: string | null
          id?: string
          in_transit?: number | null
          moq_type?: string | null
          moq_value?: number | null
          product_variant_id?: string
          purchase_order_id?: string
          quantity?: number
          received_quantity?: number
          sku?: string | null
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "erp_purchase_order_lines_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "plm_product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_purchase_order_lines_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "erp_purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_purchase_order_sales_channels: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          purchase_order_id: string
          sales_channel_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          purchase_order_id: string
          sales_channel_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          purchase_order_id?: string
          sales_channel_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_purchase_order_sales_channels_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "erp_purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_purchase_order_sales_channels_sales_channel_id_fkey"
            columns: ["sales_channel_id"]
            isOneToOne: false
            referencedRelation: "erp_sales_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_purchase_orders: {
        Row: {
          carrier: string | null
          company_id: string
          created_at: string
          datasource_id: string | null
          delivered_date: string | null
          estimated_delivery_date: string | null
          id: string
          integration_data: Json | null
          notes: string | null
          purchase_order_number: string
          shipped_date: string | null
          status: string | null
          total_amount: number
          tracking_number: string | null
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          carrier?: string | null
          company_id: string
          created_at?: string
          datasource_id?: string | null
          delivered_date?: string | null
          estimated_delivery_date?: string | null
          id?: string
          integration_data?: Json | null
          notes?: string | null
          purchase_order_number: string
          shipped_date?: string | null
          status?: string | null
          total_amount: number
          tracking_number?: string | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          carrier?: string | null
          company_id?: string
          created_at?: string
          datasource_id?: string | null
          delivered_date?: string | null
          estimated_delivery_date?: string | null
          id?: string
          integration_data?: Json | null
          notes?: string | null
          purchase_order_number?: string
          shipped_date?: string | null
          status?: string | null
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "erp_purchase_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_purchase_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "erp_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_sales_channels: {
        Row: {
          channel_code: string
          company_id: string | null
          created_at: string
          id: string
          name: string
          sales_channel_type: Database["public"]["Enums"]["sales_channel_types"]
        }
        Insert: {
          channel_code: string
          company_id?: string | null
          created_at?: string
          id?: string
          name: string
          sales_channel_type?: Database["public"]["Enums"]["sales_channel_types"]
        }
        Update: {
          channel_code?: string
          company_id?: string | null
          created_at?: string
          id?: string
          name?: string
          sales_channel_type?: Database["public"]["Enums"]["sales_channel_types"]
        }
        Relationships: [
          {
            foreignKeyName: "erp_sales_channels_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_vendor_categories: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          migration_sort_assist: number | null
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          migration_sort_assist?: number | null
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          migration_sort_assist?: number | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_vendor_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_vendor_category_assets: {
        Row: {
          category_id: string
          created_at: string
          id: string
          key: string
          name: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          key: string
          name: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          key?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_vendor_category_assets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "erp_vendor_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_vendors: {
        Row: {
          category_id: string
          company_id: string
          contact_address: string | null
          contact_city: string | null
          contact_country: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          contact_state: string | null
          contact_zip: string | null
          created_at: string
          description: string | null
          id: string
          migration_sort_assist: number | null
          name: string
          raw_address: string | null
          website_url: string | null
        }
        Insert: {
          category_id: string
          company_id: string
          contact_address?: string | null
          contact_city?: string | null
          contact_country?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_state?: string | null
          contact_zip?: string | null
          created_at?: string
          description?: string | null
          id?: string
          migration_sort_assist?: number | null
          name: string
          raw_address?: string | null
          website_url?: string | null
        }
        Update: {
          category_id?: string
          company_id?: string
          contact_address?: string | null
          contact_city?: string | null
          contact_country?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_state?: string | null
          contact_zip?: string | null
          created_at?: string
          description?: string | null
          id?: string
          migration_sort_assist?: number | null
          name?: string
          raw_address?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "erp_vendors_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "erp_vendor_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_vendors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      plm_artwork_categories: {
        Row: {
          company_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "plm_artwork_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      plm_artwork_colors: {
        Row: {
          artwork_id: string
          color_id: string
          company_id: string
          created_at: string
          id: string
        }
        Insert: {
          artwork_id: string
          color_id: string
          company_id: string
          created_at?: string
          id?: string
        }
        Update: {
          artwork_id?: string
          color_id?: string
          company_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plm_artwork_colors_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "plm_artworks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plm_artwork_colors_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "plm_colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plm_artwork_colors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      plm_artwork_variants: {
        Row: {
          artwork_id: string
          company_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          artwork_id: string
          company_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          artwork_id?: string
          company_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "plm_artwork_variants_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "plm_artworks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plm_artwork_variants_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      plm_artworks: {
        Row: {
          category_id: string
          company_id: string
          created_at: string
          id: string
          name: string
          swatch_url: string | null
        }
        Insert: {
          category_id: string
          company_id: string
          created_at?: string
          id?: string
          name: string
          swatch_url?: string | null
        }
        Update: {
          category_id?: string
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          swatch_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plm_artworks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "plm_artwork_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plm_artworks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      plm_color_libraries: {
        Row: {
          company_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "plm_color_libraries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      plm_colors: {
        Row: {
          color_library_id: string
          company_id: string
          created_at: string
          hex_code: string | null
          id: string
          library_color_code: string | null
          migration_sort_help: string | null
          name: string
          rgb_code: string | null
          swatch_url: string | null
        }
        Insert: {
          color_library_id: string
          company_id: string
          created_at?: string
          hex_code?: string | null
          id?: string
          library_color_code?: string | null
          migration_sort_help?: string | null
          name: string
          rgb_code?: string | null
          swatch_url?: string | null
        }
        Update: {
          color_library_id?: string
          company_id?: string
          created_at?: string
          hex_code?: string | null
          id?: string
          library_color_code?: string | null
          migration_sort_help?: string | null
          name?: string
          rgb_code?: string | null
          swatch_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plm_colors_color_library_id_fkey"
            columns: ["color_library_id"]
            isOneToOne: false
            referencedRelation: "plm_color_libraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plm_colors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      plm_material_compositions: {
        Row: {
          amount: number
          company_id: string
          composition_id: string
          created_at: string
          id: string
          material_id: string
        }
        Insert: {
          amount: number
          company_id: string
          composition_id: string
          created_at?: string
          id?: string
          material_id: string
        }
        Update: {
          amount?: number
          company_id?: string
          composition_id?: string
          created_at?: string
          id?: string
          material_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plm_material_compositions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plm_material_compositions_composition_id_fkey"
            columns: ["composition_id"]
            isOneToOne: false
            referencedRelation: "plm_material_type_compositions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plm_material_compositions_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "plm_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      plm_material_measurements: {
        Row: {
          company_id: string
          created_at: string
          id: string
          material_id: string
          measurement_id: string
          value: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          material_id: string
          measurement_id: string
          value: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          material_id?: string
          measurement_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "plm_material_measurements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plm_material_measurements_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "plm_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plm_material_measurements_measurement_id_fkey"
            columns: ["measurement_id"]
            isOneToOne: false
            referencedRelation: "plm_material_type_measurements"
            referencedColumns: ["id"]
          },
        ]
      }
      plm_material_type_compositions: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          material_type_id: string
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          material_type_id: string
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          material_type_id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "plm_material_type_compositions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plm_material_type_compositions_material_type_id_fkey"
            columns: ["material_type_id"]
            isOneToOne: false
            referencedRelation: "plm_material_types"
            referencedColumns: ["id"]
          },
        ]
      }
      plm_material_type_measurements: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          type_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          type_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plm_material_type_measurements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plm_material_type_measurements_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "plm_material_types"
            referencedColumns: ["id"]
          },
        ]
      }
      plm_material_types: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "plm_material_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      plm_materials: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          internal_material_code: string | null
          name: string
          swatch_url: string | null
          type_id: string
          vendor_id: string
          vendor_material_code: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          internal_material_code?: string | null
          name: string
          swatch_url?: string | null
          type_id: string
          vendor_id: string
          vendor_material_code?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          internal_material_code?: string | null
          name?: string
          swatch_url?: string | null
          type_id?: string
          vendor_id?: string
          vendor_material_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plm_materials_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plm_materials_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "plm_material_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plm_materials_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "erp_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      plm_product_categories: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          migration_sort_assist: number | null
          name: string
          type_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          migration_sort_assist?: number | null
          name: string
          type_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          migration_sort_assist?: number | null
          name?: string
          type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plm_product_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plm_product_categories_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "plm_product_types"
            referencedColumns: ["id"]
          },
        ]
      }
      plm_product_departments: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "plm_product_departments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      plm_product_types: {
        Row: {
          company_id: string
          created_at: string
          department_id: string
          description: string | null
          id: string
          migration_sort_assist: number | null
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          department_id: string
          description?: string | null
          id?: string
          migration_sort_assist?: number | null
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          department_id?: string
          description?: string | null
          id?: string
          migration_sort_assist?: number | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "plm_product_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plm_product_types_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "plm_product_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      plm_product_variants: {
        Row: {
          company_id: string
          created_at: string
          id: string
          product_id: string
          size: string
          sku: string
          upc: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          product_id: string
          size: string
          sku: string
          upc?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          product_id?: string
          size?: string
          sku?: string
          upc?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plm_product_variants_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plm_product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "api_product"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plm_product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "plm_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plm_product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_erp_purchase_order_product_progress"
            referencedColumns: ["product_id"]
          },
        ]
      }
      plm_products: {
        Row: {
          campaign_id: string
          colorway_id: string
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          integration_data: Json | null
          internal_product_code: string | null
          migration_record_id: string | null
          migration_sort_assist: number | null
          msrp: number | null
          name: string
          retail_description: string | null
          seo_description: string | null
          sourcing_id: string | null
          style_id: string | null
        }
        Insert: {
          campaign_id: string
          colorway_id: string
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          integration_data?: Json | null
          internal_product_code?: string | null
          migration_record_id?: string | null
          migration_sort_assist?: number | null
          msrp?: number | null
          name: string
          retail_description?: string | null
          seo_description?: string | null
          sourcing_id?: string | null
          style_id?: string | null
        }
        Update: {
          campaign_id?: string
          colorway_id?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          integration_data?: Json | null
          internal_product_code?: string | null
          migration_record_id?: string | null
          migration_sort_assist?: number | null
          msrp?: number | null
          name?: string
          retail_description?: string | null
          seo_description?: string | null
          sourcing_id?: string | null
          style_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plm_products_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "pm_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plm_products_colorway_id_fkey"
            columns: ["colorway_id"]
            isOneToOne: false
            referencedRelation: "pm_campaign_colorways"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plm_products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plm_products_sourcing_id_fkey"
            columns: ["sourcing_id"]
            isOneToOne: false
            referencedRelation: "plm_style_sourcing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plm_products_style_id_fkey"
            columns: ["style_id"]
            isOneToOne: false
            referencedRelation: "plm_styles"
            referencedColumns: ["id"]
          },
        ]
      }
      plm_size_index: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          migration_sort_assist: number | null
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          migration_sort_assist?: number | null
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          migration_sort_assist?: number | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "plm_size_index_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      plm_size_run_sizes: {
        Row: {
          company_id: string
          created_at: string
          id: string
          size_index_id: string
          size_order: number | null
          size_run_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          size_index_id: string
          size_order?: number | null
          size_run_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          size_index_id?: string
          size_order?: number | null
          size_run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plm_size_run_sizes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plm_size_run_sizes_size_index_id_fkey"
            columns: ["size_index_id"]
            isOneToOne: false
            referencedRelation: "plm_size_index"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plm_size_run_sizes_size_run_id_fkey"
            columns: ["size_run_id"]
            isOneToOne: false
            referencedRelation: "plm_size_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      plm_size_runs: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          migration_sort_assist: number | null
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          migration_sort_assist?: number | null
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          migration_sort_assist?: number | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "plm_size_runs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      plm_style_size_fittings: {
        Row: {
          company_id: string
          created_at: string
          id: string
          size_index_id: string
          style_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          size_index_id: string
          style_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          size_index_id?: string
          style_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plm_style_size_fittings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plm_style_size_fittings_size_index_id_fkey"
            columns: ["size_index_id"]
            isOneToOne: false
            referencedRelation: "plm_size_index"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plm_style_size_fittings_style_id_fkey"
            columns: ["style_id"]
            isOneToOne: false
            referencedRelation: "plm_styles"
            referencedColumns: ["id"]
          },
        ]
      }
      plm_style_sourcing: {
        Row: {
          cog: number | null
          company_id: string
          created_at: string
          hs_tariff_code: string | null
          id: string
          migration_sort_assist: number | null
          style_id: string
          vendor_id: string
          weight: number | null
        }
        Insert: {
          cog?: number | null
          company_id: string
          created_at?: string
          hs_tariff_code?: string | null
          id?: string
          migration_sort_assist?: number | null
          style_id: string
          vendor_id: string
          weight?: number | null
        }
        Update: {
          cog?: number | null
          company_id?: string
          created_at?: string
          hs_tariff_code?: string | null
          id?: string
          migration_sort_assist?: number | null
          style_id?: string
          vendor_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "plm_style_sourcing_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plm_style_sourcing_style_id_fkey"
            columns: ["style_id"]
            isOneToOne: false
            referencedRelation: "plm_styles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plm_style_sourcing_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "erp_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      plm_styles: {
        Row: {
          category_id: string | null
          company_id: string
          created_at: string
          description: string | null
          flat_attatchment: string | null
          gender: Database["public"]["Enums"]["Gender"] | null
          id: string
          migration_sort_assist: number | null
          size_run_id: string | null
          style_name: string | null
          style_number: string
          working_name: string | null
        }
        Insert: {
          category_id?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          flat_attatchment?: string | null
          gender?: Database["public"]["Enums"]["Gender"] | null
          id?: string
          migration_sort_assist?: number | null
          size_run_id?: string | null
          style_name?: string | null
          style_number: string
          working_name?: string | null
        }
        Update: {
          category_id?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          flat_attatchment?: string | null
          gender?: Database["public"]["Enums"]["Gender"] | null
          id?: string
          migration_sort_assist?: number | null
          size_run_id?: string | null
          style_name?: string | null
          style_number?: string
          working_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plm_styles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "plm_product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plm_styles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plm_styles_size_run_id_fkey"
            columns: ["size_run_id"]
            isOneToOne: false
            referencedRelation: "plm_size_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_campaign_categories: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "pm_campaign_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_campaign_colors: {
        Row: {
          campaign_id: string
          color_id: string
          company_id: string
          created_at: string
          id: string
          migration_sort_assist: number | null
          name: string | null
        }
        Insert: {
          campaign_id: string
          color_id: string
          company_id: string
          created_at?: string
          id?: string
          migration_sort_assist?: number | null
          name?: string | null
        }
        Update: {
          campaign_id?: string
          color_id?: string
          company_id?: string
          created_at?: string
          id?: string
          migration_sort_assist?: number | null
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pm_campaign_colors_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "pm_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_campaign_colors_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "plm_colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_campaign_colors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_campaign_colorway_artworks: {
        Row: {
          artwork_id: string
          colorway_id: string
          company_id: string
          created_at: string
          id: string
        }
        Insert: {
          artwork_id: string
          colorway_id: string
          company_id: string
          created_at?: string
          id?: string
        }
        Update: {
          artwork_id?: string
          colorway_id?: string
          company_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pm_campaign_colorway_artworks_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "plm_artwork_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_campaign_colorway_artworks_colorway_id_fkey"
            columns: ["colorway_id"]
            isOneToOne: false
            referencedRelation: "pm_campaign_colorways"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_campaign_colorway_artworks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_campaign_colorway_colors: {
        Row: {
          campaign_color_id: string
          colorway_id: string
          company_id: string
          created_at: string
          id: string
          migration_sort_assist: number | null
        }
        Insert: {
          campaign_color_id: string
          colorway_id: string
          company_id: string
          created_at?: string
          id?: string
          migration_sort_assist?: number | null
        }
        Update: {
          campaign_color_id?: string
          colorway_id?: string
          company_id?: string
          created_at?: string
          id?: string
          migration_sort_assist?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pm_campaign_colorway_colors_campaign_color_id_fkey"
            columns: ["campaign_color_id"]
            isOneToOne: false
            referencedRelation: "pm_campaign_colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_campaign_colorway_colors_colorway_id_fkey"
            columns: ["colorway_id"]
            isOneToOne: false
            referencedRelation: "pm_campaign_colorways"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_campaign_colorway_colors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_campaign_colorways: {
        Row: {
          campaign_id: string
          colorway_code: string | null
          company_id: string
          created_at: string
          id: string
          migration_sort_assist: number | null
          name: string
        }
        Insert: {
          campaign_id: string
          colorway_code?: string | null
          company_id: string
          created_at?: string
          id?: string
          migration_sort_assist?: number | null
          name: string
        }
        Update: {
          campaign_id?: string
          colorway_code?: string | null
          company_id?: string
          created_at?: string
          id?: string
          migration_sort_assist?: number | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "pm_campaign_colorways_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "pm_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_campaign_colorways_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_campaign_team_members: {
        Row: {
          campaign_team_id: string
          company_user_id: string
          created_at: string
          description: string | null
          id: string
        }
        Insert: {
          campaign_team_id: string
          company_user_id: string
          created_at?: string
          description?: string | null
          id?: string
        }
        Update: {
          campaign_team_id?: string
          company_user_id?: string
          created_at?: string
          description?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pm_campaign_team_members_campaign_team_id_fkey"
            columns: ["campaign_team_id"]
            isOneToOne: false
            referencedRelation: "pm_campaign_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_campaign_team_members_campaign_team_id_fkey"
            columns: ["campaign_team_id"]
            isOneToOne: false
            referencedRelation: "v_pm_campaign_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_project_team_members_company_user_id_fkey"
            columns: ["company_user_id"]
            isOneToOne: false
            referencedRelation: "app_company_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_project_team_members_company_user_id_fkey"
            columns: ["company_user_id"]
            isOneToOne: false
            referencedRelation: "softr_user_sync"
            referencedColumns: ["company_user_id"]
          },
          {
            foreignKeyName: "pm_project_team_members_company_user_id_fkey"
            columns: ["company_user_id"]
            isOneToOne: false
            referencedRelation: "softr_user_sync"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_campaign_team_members_duplicate: {
        Row: {
          campaign_team_id: string
          company_user_id: string
          created_at: string
          description: string | null
          id: string
        }
        Insert: {
          campaign_team_id: string
          company_user_id: string
          created_at?: string
          description?: string | null
          id?: string
        }
        Update: {
          campaign_team_id?: string
          company_user_id?: string
          created_at?: string
          description?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pm_campaign_team_members_duplicate_campaign_team_id_fkey"
            columns: ["campaign_team_id"]
            isOneToOne: false
            referencedRelation: "pm_campaign_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_campaign_team_members_duplicate_campaign_team_id_fkey"
            columns: ["campaign_team_id"]
            isOneToOne: false
            referencedRelation: "v_pm_campaign_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_campaign_team_members_duplicate_company_user_id_fkey"
            columns: ["company_user_id"]
            isOneToOne: false
            referencedRelation: "app_company_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_campaign_team_members_duplicate_company_user_id_fkey"
            columns: ["company_user_id"]
            isOneToOne: false
            referencedRelation: "softr_user_sync"
            referencedColumns: ["company_user_id"]
          },
          {
            foreignKeyName: "pm_campaign_team_members_duplicate_company_user_id_fkey"
            columns: ["company_user_id"]
            isOneToOne: false
            referencedRelation: "softr_user_sync"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_campaign_teams: {
        Row: {
          campaign_id: string
          company_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          campaign_id: string
          company_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          campaign_id?: string
          company_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "pm_project_teams_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "pm_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_project_teams_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_campaigns: {
        Row: {
          campaign_code: string | null
          campaign_image_url: string | null
          category_id: string
          company_id: string
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string | null
        }
        Insert: {
          campaign_code?: string | null
          campaign_image_url?: string | null
          category_id: string
          company_id: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
        }
        Update: {
          campaign_code?: string | null
          campaign_image_url?: string | null
          category_id?: string
          company_id?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pm_campaigns_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "pm_campaign_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_campaigns_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_project_members: {
        Row: {
          company_id: string
          company_user_id: string
          created_at: string
          id: string
          project_id: string
          role: string | null
        }
        Insert: {
          company_id: string
          company_user_id: string
          created_at?: string
          id?: string
          project_id: string
          role?: string | null
        }
        Update: {
          company_id?: string
          company_user_id?: string
          created_at?: string
          id?: string
          project_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pm_project_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_project_members_company_user_id_fkey"
            columns: ["company_user_id"]
            isOneToOne: false
            referencedRelation: "app_company_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_project_members_company_user_id_fkey"
            columns: ["company_user_id"]
            isOneToOne: false
            referencedRelation: "softr_user_sync"
            referencedColumns: ["company_user_id"]
          },
          {
            foreignKeyName: "pm_project_members_company_user_id_fkey"
            columns: ["company_user_id"]
            isOneToOne: false
            referencedRelation: "softr_user_sync"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "pm_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_project_styles: {
        Row: {
          company_id: string | null
          created_at: string
          created_by: string | null
          project_id: string
          style_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          project_id: string
          style_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          project_id?: string
          style_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pm_project_styles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_project_styles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_company_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_project_styles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "softr_user_sync"
            referencedColumns: ["company_user_id"]
          },
          {
            foreignKeyName: "pm_project_styles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "softr_user_sync"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_project_styles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "pm_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_project_styles_style_id_fkey"
            columns: ["style_id"]
            isOneToOne: false
            referencedRelation: "plm_styles"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_project_task_assignees: {
        Row: {
          company_id: string
          company_user_id: string
          created_at: string
          project_task_id: string
        }
        Insert: {
          company_id: string
          company_user_id: string
          created_at?: string
          project_task_id: string
        }
        Update: {
          company_id?: string
          company_user_id?: string
          created_at?: string
          project_task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pm_project_task_assignees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_project_task_assignees_company_user_id_fkey"
            columns: ["company_user_id"]
            isOneToOne: false
            referencedRelation: "app_company_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_project_task_assignees_company_user_id_fkey"
            columns: ["company_user_id"]
            isOneToOne: false
            referencedRelation: "softr_user_sync"
            referencedColumns: ["company_user_id"]
          },
          {
            foreignKeyName: "pm_project_task_assignees_company_user_id_fkey"
            columns: ["company_user_id"]
            isOneToOne: false
            referencedRelation: "softr_user_sync"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_project_task_assignees_project_task_id_fkey"
            columns: ["project_task_id"]
            isOneToOne: false
            referencedRelation: "pm_project_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_project_task_item_assignees: {
        Row: {
          company_id: string
          company_user_id: string
          created_at: string
          project_task_item_id: string
        }
        Insert: {
          company_id: string
          company_user_id: string
          created_at?: string
          project_task_item_id: string
        }
        Update: {
          company_id?: string
          company_user_id?: string
          created_at?: string
          project_task_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pm_project_task_item_assignees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_project_task_item_assignees_company_user_id_fkey"
            columns: ["company_user_id"]
            isOneToOne: false
            referencedRelation: "app_company_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_project_task_item_assignees_company_user_id_fkey"
            columns: ["company_user_id"]
            isOneToOne: false
            referencedRelation: "softr_user_sync"
            referencedColumns: ["company_user_id"]
          },
          {
            foreignKeyName: "pm_project_task_item_assignees_company_user_id_fkey"
            columns: ["company_user_id"]
            isOneToOne: false
            referencedRelation: "softr_user_sync"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_project_task_item_assignees_project_task_item_id_fkey"
            columns: ["project_task_item_id"]
            isOneToOne: false
            referencedRelation: "pm_project_task_items"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_project_task_items: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          name: string
          project_task_id: string
          sort_order: number
          status: string | null
          template_item_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          name: string
          project_task_id: string
          sort_order?: number
          status?: string | null
          template_item_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          name?: string
          project_task_id?: string
          sort_order?: number
          status?: string | null
          template_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pm_project_task_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_project_task_items_project_task_id_fkey"
            columns: ["project_task_id"]
            isOneToOne: false
            referencedRelation: "pm_project_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_project_task_items_template_item_id_fkey"
            columns: ["template_item_id"]
            isOneToOne: false
            referencedRelation: "pm_task_items"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_project_tasks: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          project_id: string
          status: string | null
          task_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          project_id: string
          status?: string | null
          task_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          project_id?: string
          status?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pm_project_tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_project_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_company_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_project_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "softr_user_sync"
            referencedColumns: ["company_user_id"]
          },
          {
            foreignKeyName: "pm_project_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "softr_user_sync"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "pm_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_project_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "pm_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_project_types: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "pm_project_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_projects: {
        Row: {
          campaign_id: string | null
          company_id: string
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          status: string | null
          type_id: string
        }
        Insert: {
          campaign_id?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: string | null
          type_id: string
        }
        Update: {
          campaign_id?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: string | null
          type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pm_projects_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "pm_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_projects_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "pm_project_types"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_task_categories: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      pm_task_items: {
        Row: {
          company_id: string
          created_at: string
          default_assignee_company_user_id: string | null
          description: string | null
          id: string
          name: string
          sort_order: number
          task_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          default_assignee_company_user_id?: string | null
          description?: string | null
          id?: string
          name: string
          sort_order?: number
          task_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          default_assignee_company_user_id?: string | null
          description?: string | null
          id?: string
          name?: string
          sort_order?: number
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pm_task_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_task_items_company_user_id_fkey"
            columns: ["default_assignee_company_user_id"]
            isOneToOne: false
            referencedRelation: "app_company_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_task_items_company_user_id_fkey"
            columns: ["default_assignee_company_user_id"]
            isOneToOne: false
            referencedRelation: "softr_user_sync"
            referencedColumns: ["company_user_id"]
          },
          {
            foreignKeyName: "pm_task_items_company_user_id_fkey"
            columns: ["default_assignee_company_user_id"]
            isOneToOne: false
            referencedRelation: "softr_user_sync"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_task_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "pm_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_tasks: {
        Row: {
          category_id: string | null
          company_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          category_id?: string | null
          company_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          category_id?: string | null
          company_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "pm_tasks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "pm_task_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      softr_data_view_styles: {
        Row: {
          created_at: string
          created_by_softr_user: string
          id: string
          styleConfig: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_softr_user: string
          id?: string
          styleConfig?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_softr_user?: string
          id?: string
          styleConfig?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      storage_media_types: {
        Row: {
          company_id: string
          created_at: string
          id: string
          name: string
          object_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          name: string
          object_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          object_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "storage_product_media_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storage_product_media_types_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "app_objects"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_products: {
        Row: {
          alt_text: string | null
          company_id: string
          created_at: string
          file_name: string
          file_path: string | null
          file_type: string | null
          id: string
          media_type_id: string
          object_file_folder_path_key: string | null
          product_id: string
          sort_order: number | null
        }
        Insert: {
          alt_text?: string | null
          company_id: string
          created_at?: string
          file_name: string
          file_path?: string | null
          file_type?: string | null
          id?: string
          media_type_id: string
          object_file_folder_path_key?: string | null
          product_id: string
          sort_order?: number | null
        }
        Update: {
          alt_text?: string | null
          company_id?: string
          created_at?: string
          file_name?: string
          file_path?: string | null
          file_type?: string | null
          id?: string
          media_type_id?: string
          object_file_folder_path_key?: string | null
          product_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "storage_products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storage_products_media_type_id_fkey"
            columns: ["media_type_id"]
            isOneToOne: false
            referencedRelation: "storage_media_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storage_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "api_product"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storage_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "plm_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storage_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_erp_purchase_order_product_progress"
            referencedColumns: ["product_id"]
          },
        ]
      }
      wms_cartons: {
        Row: {
          cost_per_unit: number
          created_at: string
          depth: number
          height: number
          id: string
          name: string
          swatch_url: string
          vendor_id: string
          weight: number
          width: number
        }
        Insert: {
          cost_per_unit: number
          created_at?: string
          depth: number
          height: number
          id?: string
          name: string
          swatch_url: string
          vendor_id: string
          weight: number
          width: number
        }
        Update: {
          cost_per_unit?: number
          created_at?: string
          depth?: number
          height?: number
          id?: string
          name?: string
          swatch_url?: string
          vendor_id?: string
          weight?: number
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "wms_cartons_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "erp_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      wms_inventory: {
        Row: {
          allocated_quantity: number
          available_quantity: number
          backordered_quantity: number
          company_id: string
          created_at: string
          datasource_id: string | null
          id: string
          on_hand_quantity: number
          product_variant_id: string
          reserved_quantity: number
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          allocated_quantity?: number
          available_quantity?: number
          backordered_quantity?: number
          company_id: string
          created_at?: string
          datasource_id?: string | null
          id?: string
          on_hand_quantity: number
          product_variant_id: string
          reserved_quantity?: number
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          allocated_quantity?: number
          available_quantity?: number
          backordered_quantity?: number
          company_id?: string
          created_at?: string
          datasource_id?: string | null
          id?: string
          on_hand_quantity?: number
          product_variant_id?: string
          reserved_quantity?: number
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wms_inventory_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wms_inventory_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "plm_product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wms_inventory_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "wms_warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      wms_order_channels: {
        Row: {
          company_id: string
          created_at: string | null
          external_id: string | null
          id: string
          name: string
          sales_channel_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          external_id?: string | null
          id?: string
          name: string
          sales_channel_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          external_id?: string | null
          id?: string
          name?: string
          sales_channel_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wms_order_channels_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wms_order_channels_sales_channel_id_fkey"
            columns: ["sales_channel_id"]
            isOneToOne: false
            referencedRelation: "erp_sales_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      wms_order_edi_documents: {
        Row: {
          created_at: string
          id: number
          order_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          order_id?: string
        }
        Update: {
          created_at?: string
          id?: number
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wms_order_edi_documents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "wms_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      wms_order_fulfillment_lines: {
        Row: {
          created_at: string
          external_line_id: string | null
          fulfillment_id: string
          id: string
          inventory_item_id: string
          order_line_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          external_line_id?: string | null
          fulfillment_id: string
          id?: string
          inventory_item_id: string
          order_line_id: string
          quantity: number
        }
        Update: {
          created_at?: string
          external_line_id?: string | null
          fulfillment_id?: string
          id?: string
          inventory_item_id?: string
          order_line_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "wms_order_fulfillment_lines_fulfillment_id_fkey"
            columns: ["fulfillment_id"]
            isOneToOne: false
            referencedRelation: "wms_order_fulfillments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wms_order_fulfillment_lines_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "wms_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wms_order_fulfillment_lines_order_line_id_fkey"
            columns: ["order_line_id"]
            isOneToOne: false
            referencedRelation: "wms_order_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      wms_order_fulfillments: {
        Row: {
          carton_id: string
          carton_number: string
          created_at: string
          external_id: string | null
          fulfillment_date: string
          fulfillment_internal_id: string | null
          fulfillment_number: string
          id: string
          order_id: string
          warehouse_id: string
        }
        Insert: {
          carton_id: string
          carton_number: string
          created_at?: string
          external_id?: string | null
          fulfillment_date: string
          fulfillment_internal_id?: string | null
          fulfillment_number: string
          id?: string
          order_id: string
          warehouse_id: string
        }
        Update: {
          carton_id?: string
          carton_number?: string
          created_at?: string
          external_id?: string | null
          fulfillment_date?: string
          fulfillment_internal_id?: string | null
          fulfillment_number?: string
          id?: string
          order_id?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wms_order_fulfillments_carton_id_fkey"
            columns: ["carton_id"]
            isOneToOne: false
            referencedRelation: "wms_cartons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wms_order_fulfillments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "wms_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wms_order_fulfillments_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "wms_warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      wms_order_lines: {
        Row: {
          company_id: string
          created_at: string
          external_id: string | null
          id: string
          line_total: number
          order_id: string
          price: number | null
          product_title: string | null
          product_variant_id: string
          quantity: number
          sku: string | null
          upc: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          external_id?: string | null
          id?: string
          line_total: number
          order_id: string
          price?: number | null
          product_title?: string | null
          product_variant_id: string
          quantity: number
          sku?: string | null
          upc?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          external_id?: string | null
          id?: string
          line_total?: number
          order_id?: string
          price?: number | null
          product_title?: string | null
          product_variant_id?: string
          quantity?: number
          sku?: string | null
          upc?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wms_order_lines_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wms_order_lines_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "wms_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wms_order_lines_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "plm_product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      wms_order_routing: {
        Row: {
          company_id: string
          destination_location_id: string | null
          from_location_id: string | null
          id: string
          order_id: string
          status: string
          step_number: number
        }
        Insert: {
          company_id: string
          destination_location_id?: string | null
          from_location_id?: string | null
          id?: string
          order_id: string
          status?: string
          step_number?: number
        }
        Update: {
          company_id?: string
          destination_location_id?: string | null
          from_location_id?: string | null
          id?: string
          order_id?: string
          status?: string
          step_number?: number
        }
        Relationships: []
      }
      wms_orders: {
        Row: {
          allocation_reference_number: string | null
          company_id: string
          created_at: string
          customer_id: string | null
          datasource_id: string | null
          datasource_link: string | null
          datasource_raw_data: Json | null
          end_ship_window_date: string | null
          external_id: string | null
          fulfillment_status:
            | Database["public"]["Enums"]["fulfillment_status"]
            | null
          id: string
          order_channel_id: string | null
          order_lifecycle: Database["public"]["Enums"]["order_lifecycle"] | null
          order_number: string
          order_total: number | null
          paid_amount: string | null
          purchase_order_number: string | null
          purchasing_company_location_id: string | null
          shipping_address: Json | null
          start_ship_window_date: string | null
          system_of_record: string | null
          total_discounts: number | null
          total_outstanding: number | null
          total_shipping: number | null
        }
        Insert: {
          allocation_reference_number?: string | null
          company_id: string
          created_at?: string
          customer_id?: string | null
          datasource_id?: string | null
          datasource_link?: string | null
          datasource_raw_data?: Json | null
          end_ship_window_date?: string | null
          external_id?: string | null
          fulfillment_status?:
            | Database["public"]["Enums"]["fulfillment_status"]
            | null
          id?: string
          order_channel_id?: string | null
          order_lifecycle?:
            | Database["public"]["Enums"]["order_lifecycle"]
            | null
          order_number: string
          order_total?: number | null
          paid_amount?: string | null
          purchase_order_number?: string | null
          purchasing_company_location_id?: string | null
          shipping_address?: Json | null
          start_ship_window_date?: string | null
          system_of_record?: string | null
          total_discounts?: number | null
          total_outstanding?: number | null
          total_shipping?: number | null
        }
        Update: {
          allocation_reference_number?: string | null
          company_id?: string
          created_at?: string
          customer_id?: string | null
          datasource_id?: string | null
          datasource_link?: string | null
          datasource_raw_data?: Json | null
          end_ship_window_date?: string | null
          external_id?: string | null
          fulfillment_status?:
            | Database["public"]["Enums"]["fulfillment_status"]
            | null
          id?: string
          order_channel_id?: string | null
          order_lifecycle?:
            | Database["public"]["Enums"]["order_lifecycle"]
            | null
          order_number?: string
          order_total?: number | null
          paid_amount?: string | null
          purchase_order_number?: string | null
          purchasing_company_location_id?: string | null
          shipping_address?: Json | null
          start_ship_window_date?: string | null
          system_of_record?: string | null
          total_discounts?: number | null
          total_outstanding?: number | null
          total_shipping?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "wms_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wms_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wms_orders_order_channel_id_fkey"
            columns: ["order_channel_id"]
            isOneToOne: false
            referencedRelation: "wms_order_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wms_orders_purchasing_company_location_id_fkey"
            columns: ["purchasing_company_location_id"]
            isOneToOne: false
            referencedRelation: "crm_company_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      wms_warehouses: {
        Row: {
          address: string | null
          city: string | null
          company_id: string
          country: string | null
          created_at: string
          email: string | null
          external_id: string | null
          id: string
          name: string | null
          phone: string | null
          state: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_id: string
          country?: string | null
          created_at?: string
          email?: string | null
          external_id?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          state?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company_id?: string
          country?: string | null
          created_at?: string
          email?: string | null
          external_id?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          state?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wms_warehouses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      api_product: {
        Row: {
          cog: number | null
          company_id: string | null
          id: string | null
          price: number | null
          product_category: string | null
          product_code: string | null
          product_name: string | null
          product_retail_description: string | null
          product_seo_description: string | null
          product_type: string | null
          style_number: string | null
          variants: Json | null
          vendor: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plm_products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      softr_user_sync: {
        Row: {
          company: string | null
          company_id: string | null
          company_logo: string | null
          company_user_id: string | null
          created_at: string | null
          department: string | null
          department_title_id: string | null
          email: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          last_seen: string | null
          org_user_id: string | null
          organization_id: string | null
          profile_picture_url: string | null
          role_id: string | null
          title: string | null
          user_full_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_company_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_company_users_department_title_id_fkey"
            columns: ["department_title_id"]
            isOneToOne: false
            referencedRelation: "app_company_department_titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_company_users_org_user_id_fkey"
            columns: ["org_user_id"]
            isOneToOne: false
            referencedRelation: "app_organization_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_company_users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "app_company_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_organization_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "app_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_erp_purchase_order_product_progress: {
        Row: {
          allocation_status: string | null
          product_id: string | null
          product_name: string | null
          purchase_order_id: string | null
          received_progress_pct: number | null
          size_qty_html: string | null
          total_incoming: number | null
          total_items: number | null
          total_received: number | null
        }
        Relationships: [
          {
            foreignKeyName: "erp_purchase_order_lines_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "erp_purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      v_erp_purchase_order_sales_channels: {
        Row: {
          id: string | null
          purchase_order_id: string | null
          sales_channel_id: string | null
          sales_channel_name: string | null
        }
        Insert: {
          id?: string | null
          purchase_order_id?: string | null
          sales_channel_id?: string | null
          sales_channel_name?: never
        }
        Update: {
          id?: string | null
          purchase_order_id?: string | null
          sales_channel_id?: string | null
          sales_channel_name?: never
        }
        Relationships: [
          {
            foreignKeyName: "erp_purchase_order_sales_channels_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "erp_purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_purchase_order_sales_channels_sales_channel_id_fkey"
            columns: ["sales_channel_id"]
            isOneToOne: false
            referencedRelation: "erp_sales_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      v_pm_campaign_team_members: {
        Row: {
          campaign_id: string | null
          campaign_team_id: string | null
          campaign_team_name: string | null
          company_id: string | null
          company_user_id: string | null
          department: string | null
          description: string | null
          id: string | null
          profile_picture_url: string | null
          title: string | null
          user_full_name: string | null
        }
        Insert: {
          campaign_id?: never
          campaign_team_id?: string | null
          campaign_team_name?: never
          company_id?: never
          company_user_id?: string | null
          department?: never
          description?: string | null
          id?: string | null
          profile_picture_url?: never
          title?: never
          user_full_name?: never
        }
        Update: {
          campaign_id?: never
          campaign_team_id?: string | null
          campaign_team_name?: never
          company_id?: never
          company_user_id?: string | null
          department?: never
          description?: string | null
          id?: string | null
          profile_picture_url?: never
          title?: never
          user_full_name?: never
        }
        Relationships: [
          {
            foreignKeyName: "pm_campaign_team_members_campaign_team_id_fkey"
            columns: ["campaign_team_id"]
            isOneToOne: false
            referencedRelation: "pm_campaign_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_campaign_team_members_campaign_team_id_fkey"
            columns: ["campaign_team_id"]
            isOneToOne: false
            referencedRelation: "v_pm_campaign_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_project_team_members_company_user_id_fkey"
            columns: ["company_user_id"]
            isOneToOne: false
            referencedRelation: "app_company_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_project_team_members_company_user_id_fkey"
            columns: ["company_user_id"]
            isOneToOne: false
            referencedRelation: "softr_user_sync"
            referencedColumns: ["company_user_id"]
          },
          {
            foreignKeyName: "pm_project_team_members_company_user_id_fkey"
            columns: ["company_user_id"]
            isOneToOne: false
            referencedRelation: "softr_user_sync"
            referencedColumns: ["id"]
          },
        ]
      }
      v_pm_campaign_teams: {
        Row: {
          campaign_id: string | null
          company_id: string | null
          id: string | null
          members: Json | null
          name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pm_project_teams_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "pm_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_project_teams_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "app_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      v_po_line_allocations: {
        Row: {
          id: string | null
          po_quantity: number | null
          product: string | null
          product_id: string | null
          purchase_order_id: string | null
          purchase_order_line_id: string | null
          quantity: number | null
          sales_channel: string | null
          sales_channel_id: string | null
          size: string | null
          sku: string | null
          upc: string | null
        }
        Insert: {
          id?: string | null
          po_quantity?: never
          product?: never
          product_id?: never
          purchase_order_id?: never
          purchase_order_line_id?: string | null
          quantity?: number | null
          sales_channel?: never
          sales_channel_id?: string | null
          size?: never
          sku?: never
          upc?: never
        }
        Update: {
          id?: string | null
          po_quantity?: never
          product?: never
          product_id?: never
          purchase_order_id?: never
          purchase_order_line_id?: string | null
          quantity?: number | null
          sales_channel?: never
          sales_channel_id?: string | null
          size?: never
          sku?: never
          upc?: never
        }
        Relationships: [
          {
            foreignKeyName: "erp_purchase_order_line_allocations_purchase_order_line_id_fkey"
            columns: ["purchase_order_line_id"]
            isOneToOne: false
            referencedRelation: "erp_purchase_order_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_purchase_order_line_allocations_sales_channel_id_fkey1"
            columns: ["sales_channel_id"]
            isOneToOne: false
            referencedRelation: "erp_purchase_order_sales_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_purchase_order_line_allocations_sales_channel_id_fkey1"
            columns: ["sales_channel_id"]
            isOneToOne: false
            referencedRelation: "v_erp_purchase_order_sales_channels"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _company_parent_org: { Args: { p_company_id: string }; Returns: string }
      add_company_member: {
        Args: {
          p_company_id: string
          p_department_title_id?: string
          p_email: string
          p_first_name?: string
          p_last_name?: string
          p_role?: Database["public"]["Enums"]["organization_roles"]
        }
        Returns: string
      }
      api_get_value_generic: {
        Args: { p_api_row: Json; p_arr_key: string; p_source_column: string }
        Returns: string
      }
      api_product_get_value: {
        Args: { p_api_row: Json; p_source_column: string }
        Returns: string
      }
      apply_url_variables_from_array: {
        Args: { p_url: string; p_vars: Json }
        Returns: string
      }
      check_company_member_email: {
        Args: { p_email: string; p_slug: string }
        Returns: boolean
      }
      cleanup_wms_inventory: {
        Args: {
          _company_id: string
          _product_variant_ids: string[]
          _warehouse_id: string
        }
        Returns: number
      }
      create_company_department: {
        Args: { p_company_id: string; p_description?: string; p_name: string }
        Returns: string
      }
      create_company_department_title: {
        Args: {
          p_company_id: string
          p_department_id: string
          p_description?: string
          p_name: string
        }
        Returns: string
      }
      create_org_company: {
        Args: { p_name: string; p_org_id: string; p_slug?: string }
        Returns: {
          id: string
          slug: string
        }[]
      }
      create_org_user: {
        Args: {
          p_email: string
          p_first_name?: string
          p_last_name?: string
          p_org_id: string
          p_role?: Database["public"]["Enums"]["organization_roles"]
        }
        Returns: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          profile_picture_url: string
          role: Database["public"]["Enums"]["organization_roles"]
        }[]
      }
      create_pm_project_task_from_template: {
        Args: {
          p_company_id: string
          p_created_by?: string
          p_description?: string
          p_due_date?: string
          p_project_id: string
          p_status?: string
          p_template_id: string
        }
        Returns: string
      }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      delete_company: { Args: { p_company_id: string }; Returns: undefined }
      delete_company_department: {
        Args: { p_department_id: string }
        Returns: undefined
      }
      delete_company_department_title: {
        Args: { p_title_id: string }
        Returns: undefined
      }
      find_products_by_shopify_gid: {
        Args: { p_company_integration_id: string; p_shopify_gid: string }
        Returns: {
          id: string
          integration_data: Json
        }[]
      }
      get_company_public_by_slug: {
        Args: { p_slug: string }
        Returns: {
          custom_theme_portal: boolean
          id: string
          logo_url: string
          name: string
          organization_id: string
          portal_theme: Json
          slug: string
        }[]
      }
      get_crm_bundle: { Args: { p_company_slug: string }; Returns: Json }
      get_erp_bundle: { Args: { p_company_slug: string }; Returns: Json }
      get_orders_dashboard: { Args: { p_company_slug: string }; Returns: Json }
      get_plm_bundle: { Args: { p_company_slug: string }; Returns: Json }
      get_pm_bundle: { Args: { p_company_slug: string }; Returns: Json }
      get_user_company_ids: { Args: never; Returns: string[] }
      get_wms_bundle: { Args: { p_company_slug: string }; Returns: Json }
      is_org_admin: { Args: { org_id: string }; Returns: boolean }
      is_org_owner: { Args: { p_org_id: string }; Returns: boolean }
      list_org_users_with_last_sign_in: {
        Args: { p_org_id: string }
        Returns: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          last_sign_in_at: string
          profile_picture_url: string
          role: Database["public"]["Enums"]["organization_roles"]
        }[]
      }
      my_org_ids: { Args: never; Returns: string[] }
      my_org_role: {
        Args: { p_org_id: string }
        Returns: Database["public"]["Enums"]["organization_roles"]
      }
      my_org_role_jwt: {
        Args: { p_org_id: string }
        Returns: Database["public"]["Enums"]["organization_roles"]
      }
      my_saas_org_ids_jwt: { Args: never; Returns: string[] }
      onboard_saas_user: {
        Args: { p_first_name: string; p_last_name: string; p_org_name: string }
        Returns: string
      }
      plm_product_rederive_shopify_status: {
        Args: { p_company_integration_id: string; p_product_id: string }
        Returns: boolean
      }
      plm_product_update_shopify_current_values: {
        Args: {
          p_company_integration_id: string
          p_product_payload: Json
          p_shopify_product_gid: string
        }
        Returns: number
      }
      remove_company_member: {
        Args: { p_company_user_id: string }
        Returns: undefined
      }
      set_company_member_title: {
        Args: { p_company_user_id: string; p_department_title_id: string }
        Returns: string
      }
      shopify_sync_process_response_by_request_id: {
        Args: { p_request_id: number }
        Returns: boolean
      }
      shopify_sync_recent_cleanup: { Args: never; Returns: undefined }
      update_company: {
        Args: {
          p_company_id: string
          p_logo_url?: string
          p_name?: string
          p_primary_color_hex?: string
          p_secondary_color_hex?: string
          p_website_url?: string
        }
        Returns: undefined
      }
      update_company_department: {
        Args: {
          p_department_id: string
          p_description?: string
          p_name: string
        }
        Returns: string
      }
      update_organization_basics: {
        Args: { p_logo_url?: string; p_name?: string; p_org_id: string }
        Returns: {
          created_at: string
          created_by: string | null
          id: string
          logo_url: string | null
          name: string
          personal_org: boolean
          slug: string | null
          subdomain: string | null
        }
        SetofOptions: {
          from: "*"
          to: "app_organizations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      user_org_ids: { Args: { uid: string }; Returns: string[] }
      user_org_ids_via_companies: { Args: { uid: string }; Returns: string[] }
    }
    Enums: {
      "AUTHENTICTION METHODS": "OAUTH" | "API_KEY"
      company_location_types: "RETAIL" | "DISTRIBUTION_CENTER" | "HQ"
      "DATASOURCE CONNECTION TYPE": "MULTI_ACCOUNT" | "SINGLE_ACCOUNT"
      fulfillment_status: "UNFULFILLED" | "PARTIAL" | "FULFILLED"
      Gender: "WOMENS" | "MENS" | "UNISEX"
      mime_type:
        | "application/json"
        | "application/pdf"
        | "application/xml"
        | "application/zip"
        | "application/octet-stream"
        | "text/plain"
        | "text/csv"
        | "text/html"
        | "text/css"
        | "text/javascript"
        | "image/jpeg"
        | "image/png"
        | "image/gif"
        | "image/webp"
        | "image/svg+xml"
        | "audio/mpeg"
        | "audio/wav"
        | "video/mp4"
        | "video/webm"
      order_lifecycle: "ALLOCATION" | "OPEN" | "CLOSED"
      organization_roles: "ADMIN" | "OWNER" | "COMPANY"
      sales_channel_types: "B2B" | "DTC"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      "AUTHENTICTION METHODS": ["OAUTH", "API_KEY"],
      company_location_types: ["RETAIL", "DISTRIBUTION_CENTER", "HQ"],
      "DATASOURCE CONNECTION TYPE": ["MULTI_ACCOUNT", "SINGLE_ACCOUNT"],
      fulfillment_status: ["UNFULFILLED", "PARTIAL", "FULFILLED"],
      Gender: ["WOMENS", "MENS", "UNISEX"],
      mime_type: [
        "application/json",
        "application/pdf",
        "application/xml",
        "application/zip",
        "application/octet-stream",
        "text/plain",
        "text/csv",
        "text/html",
        "text/css",
        "text/javascript",
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
        "audio/mpeg",
        "audio/wav",
        "video/mp4",
        "video/webm",
      ],
      order_lifecycle: ["ALLOCATION", "OPEN", "CLOSED"],
      organization_roles: ["ADMIN", "OWNER", "COMPANY"],
      sales_channel_types: ["B2B", "DTC"],
    },
  },
} as const
