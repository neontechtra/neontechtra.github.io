// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docs: [
    {
      type: 'category',
      label: 'Home',
      items: ['home'],
      collapsed: true,
      collapsible: true,
    },
    {
      type: 'category',
      label: 'Home Lab',
      items: [
        {
          type: 'category',
          label: 'Lab (D2.LOD)',
          items: ['homelab/structure/layout'],
          collapsed: true,
          collapsible: true,
        },
      ],
      collapsed: true,
      collapsible: true,
    },
    {
      type: 'category',
      label: 'Active Directory',
      items: [
        {
          type: 'category',
          label: 'GOAD',
          items: [
            'active-directory/goad/part1',
            'active-directory/goad/part2',
          ],
          collapsed: true,
          collapsible: true,
        },
        {
          type: 'category',
          label: 'NHA',
          items: [
            'active-directory/nha/part1',
            'active-directory/nha/part2',
            'active-directory/nha/part3',
            'active-directory/nha/part4',
            'active-directory/nha/part5',
            'active-directory/nha/part6',
          ],
          collapsed: true,
          collapsible: true,
        },
      ],
      collapsed: true,
      collapsible: true,
    },
    {
      type: 'category',
      label: 'Web Exploitation',
      items: [
        {
          type: 'category',
          label: 'PortSwigger',
          items: ['web-exploitation/portswigger/sql-injection-lab1'],
          collapsed: true,
          collapsible: true,
        },
      ],
      collapsed: true,
      collapsible: true,
    },
    {
      type: 'category',
      label: 'About',
      items: ['about-me'],
      collapsed: true,
      collapsible: true,
    },
  ],
};

export default sidebars;
