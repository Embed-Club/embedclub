import { CollectionConfig } from "payload";

export const Gallery: CollectionConfig = {
    slug: "gallery",
    admin: {
        useAsTitle: "title",
        defaultColumns: ['title', 'image'],
    },
    access: {
        read: () => true,
    },
    fields:[
        {
            name: 'title',
            label: 'Title',
            type: 'text',
            required: true,
        },
    ],
    upload: {
        staticDir: 'gallery',
        imageSizes: [
            {
                name: 'thumbnail',
                width: 1200,
                withoutEnlargement: true,
            },
            
        ]
    }
}

export default Gallery