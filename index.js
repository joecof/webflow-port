// const content = require('./contentful.json')
const content = require('./contentful2.json')
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// contentful space export --max-allowed-limit  1 --content-only  --download-assets   --content-file contentful2.json

const nodeTypeMap = {
  "document": "div",
  "table": "table",
  "table-row": "tr",
  "table-header-cell": "th",
  "table-cell": "td",
  "paragraph": "p",
  "text": "span",
  "heading-1": "h2",
  "heading-2": "h3",
  "heading-3": "h4",
  "heading-4": "h4",
  "heading-5": "h5",
  "heading-6": "h6",
  "blockquote": "blockquote",
  "hr": "hr",
  "ordered-list": "ol",
  "unordered-list": "ul",
  "list-item": "li",
  "embedded-entry-block": "div",
  "embedded-asset-block": "div",
  "embedded-entry-inline": "span",
  "hyperlink": "a",
  "entry-hyperlink": "a",
  "asset-hyperlink": "a"
}

let html = ''
let isListItem = false;

const traverseArray = (array) => {

  for (const element of array) {

    if (element.content && Array.isArray(element.content)) {
      html += `<${nodeTypeMap[element.nodeType]} ${element.nodeType === 'hyperlink' ? `href=${element.data.uri}` : ''}>`

      const headers = [
        "heading-1",
        "heading-2",
        "heading-3",
        "heading-4",
        "heading-5",
        "heading-6"
      ]

      const elementIsAList = element.nodeType === 'list-item' || element.nodeType === 'unordered-list' || element.nodeType === 'ordered-list';
      const elementIsAParagraph = element.nodeType === 'paragraph';
      const elementIsAHeader = headers.includes(element.nodeType)

      const isParagraphOrHeaderUnderList = element.content.length && (element.content[0].nodeType === 'paragraph' || headers.includes(element.content[0].nodeType));

      if(elementIsAList && isParagraphOrHeaderUnderList) {
        isListItem = true;
      } 

      traverseArray(element.content);
      html += `</${nodeTypeMap[element.nodeType]}> ${elementIsAList || (isListItem && (elementIsAParagraph || elementIsAHeader)) ? '' : ''}`.trim() 
      html += !isListItem && elementIsAParagraph ? '<div><br></div>' : '';
      isListItem = false;
    } else {
      html += `<${nodeTypeMap[element.nodeType]}>${element.value.replace(/\n/g, '')}</${nodeTypeMap[element.nodeType]}>`;
    }
  }
}

const data = []
const sample = [ ...content.entries.slice(15) ]

sample.forEach((entry, i) => {
  let name = ''
  let slug = ''
  let hero_id = ''

  try {
    name = entry.fields.metaTitle['en-US']
    slug = entry.fields.blogSlug['en-US']
    hero_id = entry.fields.blogImage['en-US'].sys.id
    
    if(!entry.fields.blogDescription) {
      return; 
    }

    html += `<h3>${name}</h3>`
    if(entry.fields?.blogDescription['en-US'].content) {
      traverseArray(entry.fields.blogDescription['en-US'].content)
    } else {
      console.log('no content')
    }
    
  } catch(e) {
    name = entry.fields.title['en-US']
    html += `<h3>${name}</h3>`
  }
  
  const url = `https:${(content.assets.find(item => item.sys.id === hero_id)?.fields.file['en-US'].url || '').replace(/\s/g, '')}`;

  if(url === 'https:') {
    return;
  }

  data.push({
    name,
    slug,
    html,
    image: url
  });

  html=''
})


const csvWriter = createCsvWriter({
  path: `port_${1}.csv`,
  header: [
      { id: 'name', title: 'Name' },
      { id: 'slug', title: 'Slug' },
      { id: 'html', title: 'Body' },
      { id: 'image', title: 'Image' }
  ]
});

csvWriter.writeRecords([...data])
  .then(() => {
      console.log(`CSV file port_${1}.csv written.`);
  })
  .catch((err) => {
      console.error(`Error writing CSV file port_${1}.csv:`, err);
  });