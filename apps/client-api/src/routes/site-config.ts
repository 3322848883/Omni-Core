import { Router } from 'express';

const router = Router();

// Public site configuration
router.get('/public', (req, res) => {
  res.json({
    success: true,
    data: {
      site_name: 'Omni Core',
      site_description: '安全、快速、匿名的网络体验',
      seo_description: 'Omni Core 提供军事级加密、全球节点覆盖、零日志政策的 VPN 服务',
      hero_title: '安全、快速、匿名的网络体验',
      hero_subtitle: 'Omni Core 提供军事级加密保护，让您自由访问全球网络',
      features_title: '为什么选择 Omni Core',
      features_subtitle: '我们致力于为您提供最优质的 VPN 服务体验',
      servers_title: '全球服务器节点',
      servers_subtitle: '覆盖全球主要地区，为您提供稳定的连接',
      pricing_title: '选择适合您的方案',
      pricing_subtitle: '灵活的套餐选择，满足不同需求',
      faq_title: '常见问题',
      faq_subtitle: '解答您的疑问',
      contact_email: 'support@omnicore.vpn',
      contact_telegram: 'https://t.me/omnicore',
    }
  });
});

export default router;
