import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import 'element-plus/dist/index.css';

import App from './App.vue';
import router from './router';
import { useUserStore } from '@/stores/user';

// Global styles
import './assets/styles/index.scss';

const app = createApp(App);

// Register all Element Plus icons
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

const pinia = createPinia();
app.use(pinia);

// Initialize user store from localStorage
const userStore = useUserStore();
userStore.initFromStorage();

app.use(router);
app.use(ElementPlus);

app.mount('#app');
