#!/usr/bin/env node

/**
 * DEV-UI-01 Validation Script
 * Validates that all required UI components are created and properly exported
 */

const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src', 'components', 'ui');
const indexFile = path.join(componentsDir, 'index.ts');

console.log('🔍 Validating DEV-UI-01: Enhanced shadcn/ui Setup with Metronic Theme\n');

// Check if components directory exists
if (!fs.existsSync(componentsDir)) {
  console.error('❌ Components directory not found:', componentsDir);
  process.exit(1);
}

console.log('✅ Components directory exists');

// Required components list
const requiredComponents = [
  'accordion', 'alert', 'alert-dialog', 'aspect-ratio', 'avatar', 'badge',
  'breadcrumb', 'button', 'calendar', 'card', 'carousel', 'checkbox',
  'collapsible', 'command', 'context-menu', 'dialog', 'dropdown-menu',
  'form', 'hover-card', 'input', 'label', 'menubar', 'navigation-menu',
  'pagination', 'popover', 'progress', 'radio-group', 'resizable',
  'scroll-area', 'select', 'separator', 'sheet', 'skeleton', 'slider',
  'switch', 'table', 'tabs', 'textarea', 'toast', 'toggle', 'tooltip'
];

let missingComponents = [];
let existingComponents = [];

// Check each required component
requiredComponents.forEach(component => {
  const componentPath = path.join(componentsDir, `${component}.tsx`);
  if (fs.existsSync(componentPath)) {
    existingComponents.push(component);
    console.log(`✅ ${component}.tsx exists`);
  } else {
    missingComponents.push(component);
    console.error(`❌ ${component}.tsx missing`);
  }
});

// Check index.ts file
if (!fs.existsSync(indexFile)) {
  console.error('❌ index.ts file not found');
  process.exit(1);
}

console.log('\n✅ Index file exists');

// Read and validate index.ts exports
try {
  const indexContent = fs.readFileSync(indexFile, 'utf8');
  const exportMatches = indexContent.match(/export \* from "\.\/([^"]+)"/g) || [];

  const exportedComponents = exportMatches.map(match => {
    const component = match.match(/export \* from "\.\/([^"]+)"/)[1];
    return component;
  });

  console.log('\n📦 Validating exports...');

  requiredComponents.forEach(component => {
    if (exportedComponents.includes(component)) {
      console.log(`✅ ${component} is exported`);
    } else {
      console.error(`❌ ${component} is not exported`);
      missingComponents.push(`${component} (not exported)`);
    }
  });

} catch (error) {
  console.error('❌ Error reading index.ts:', error.message);
  process.exit(1);
}

// Summary
console.log('\n📊 Validation Summary:');
console.log(`✅ Components created: ${existingComponents.length}/${requiredComponents.length}`);
console.log(`✅ Components exported: ${requiredComponents.length - missingComponents.length}/${requiredComponents.length}`);

if (missingComponents.length === 0) {
  console.log('\n🎉 DEV-UI-01 VALIDATION PASSED!');
  console.log('All required UI components have been successfully created with Metronic theming.');
  process.exit(0);
} else {
  console.log('\n❌ DEV-UI-01 VALIDATION FAILED!');
  console.log('Missing components:', missingComponents.join(', '));
  process.exit(1);
}