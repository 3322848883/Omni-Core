import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import en from 'element-plus/es/locale/lang/en';
import 'element-plus/dist/index.css';

import App from './App.vue';
import router from './router';
import i18n from '@/locales/index';

// Global styles
import './styles/index.scss';

const app = createApp(App);

// Register all Element Plus icons
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

const getElementPlusLocale = () => {
  const locale = localStorage.getItem('locale') || 'zh-CN';
  return locale === 'zh-CN' ? zhCn : en;
};

app.use(createPinia());
app.use(router);
app.use(i18n);
app.use(ElementPlus, {
  locale: getElementPlusLocale()
});

app.mount('#app');
