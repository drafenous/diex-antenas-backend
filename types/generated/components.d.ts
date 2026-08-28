import type { Schema, Struct } from '@strapi/strapi';

export interface TechnicalSpecificationsTechnicalSpecifications
  extends Struct.ComponentSchema {
  collectionName: 'components_technical_specifications_technical_specifications';
  info: {
    displayName: 'technicalSpecifications';
    icon: 'th-list';
  };
  attributes: {
    name: Schema.Attribute.String & Schema.Attribute.Required;
    value: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'technical-specifications.technical-specifications': TechnicalSpecificationsTechnicalSpecifications;
    }
  }
}
