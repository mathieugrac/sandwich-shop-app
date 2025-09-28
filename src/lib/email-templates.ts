import fs from 'fs';
import path from 'path';

export interface TemplateData {
  [key: string]: string | number | boolean | Array<Record<string, string | number>> | undefined;
}

export function renderTemplate(templateName: string, data: TemplateData): string {
  try {
    const templatePath = path.join(process.cwd(), 'src', 'emails', `${templateName}.html`);
    let template = fs.readFileSync(templatePath, 'utf8');
    
    // Replace simple variables
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'string' || typeof value === 'number') {
        template = template.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      }
    });
    
    // Handle conditional blocks
    template = handleConditionals(template, data);
    
    // Handle loops
    template = handleLoops(template, data);
    
    return template;
  } catch (error) {
    console.error(`Error rendering template ${templateName}:`, error);
    throw new Error(`Failed to render email template: ${templateName}`);
  }
}

function handleConditionals(template: string, data: TemplateData): string {
  // Handle {{#if variable}}...{{/if}} blocks
  const ifRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  
  return template.replace(ifRegex, (match, variable, content) => {
    if (data[variable]) {
      return content;
    }
    return '';
  });
}

function handleLoops(template: string, data: TemplateData): string {
  // Handle {{#each items}}...{{/each}} blocks
  const eachRegex = /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
  
  return template.replace(eachRegex, (match, arrayName, content) => {
    const array = data[arrayName];
    
    if (!Array.isArray(array)) {
      return '';
    }
    
    return array.map(item => {
      let itemContent = content;
      // Replace item properties in the loop
      Object.entries(item).forEach(([key, value]) => {
        itemContent = itemContent.replace(
          new RegExp(`{{${key}}}`, 'g'), 
          String(value)
        );
      });
      return itemContent;
    }).join('');
  });
}

// Helper function to get shop information
export function getShopInfo() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  return {
    shopName: process.env.NEXT_PUBLIC_SHOP_NAME || 'Your Sandwich Shop',
    shopPhone: process.env.NEXT_PUBLIC_SHOP_PHONE || '+1234567890',
    shopEmail: process.env.NEXT_PUBLIC_SHOP_EMAIL || 'orders@fome-sandes.pt',
    shopPhoneNumber: process.env.NEXT_PUBLIC_SHOP_PHONE_NUMBER || '+33 6 52 41 39 01',
    baseUrl: baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  };
}
