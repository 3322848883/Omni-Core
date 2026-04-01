import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick } from 'vue';
import VirtualList from '../VirtualList.vue';

// 创建测试用的列表项组件
const TestItem = defineComponent({
  props: ['item', 'index'],
  setup(props: { item: { id: number; name: string }; index: number }) {
    return () =>
      h(
        'div',
        {
          class: 'test-item',
          style: { height: '50px' },
        },
        `${props.item.name} - ${props.index}`
      );
  },
});

describe('VirtualList', () => {
  const mockItems = Array.from({ length: 100 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
  }));

  beforeEach(() => {
    // Mock ResizeObserver
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render correctly', () => {
    const wrapper = mount(VirtualList, {
      props: {
        items: mockItems,
        itemHeight: 50,
        containerHeight: 300,
      },
      slots: {
        default: (props: { item: unknown; index: number }) =>
          h(TestItem, { item: props.item as { id: number; name: string }, index: props.index }),
      },
    });

    expect(wrapper.find('.virtual-list-container').exists()).toBe(true);
    expect(wrapper.find('.virtual-list-phantom').exists()).toBe(true);
    expect(wrapper.find('.virtual-list-content').exists()).toBe(true);
  });

  it('should calculate total height correctly', () => {
    const wrapper = mount(VirtualList, {
      props: {
        items: mockItems,
        itemHeight: 50,
        containerHeight: 300,
      },
      slots: {
        default: (props: { item: unknown; index: number }) =>
          h(TestItem, { item: props.item as { id: number; name: string }, index: props.index }),
      },
    });

    const phantom = wrapper.find('.virtual-list-phantom');
    expect(phantom.attributes('style')).toContain('height: 5000px');
  });

  it('should render only visible items', async () => {
    const wrapper = mount(VirtualList, {
      props: {
        items: mockItems,
        itemHeight: 50,
        containerHeight: 300,
        bufferSize: 2,
      },
      slots: {
        default: (props: { item: unknown; index: number }) =>
          h(TestItem, { item: props.item as { id: number; name: string }, index: props.index }),
      },
      attachTo: document.body,
    });

    await nextTick();

    // With container height of 300px and item height of 50px,
    // we should see about 6 items + buffer
    const items = wrapper.findAll('.virtual-list-item');
    expect(items.length).toBeLessThanOrEqual(12); // 6 visible + buffer
  });

  it('should use custom key field', () => {
    const wrapper = mount(VirtualList, {
      props: {
        items: mockItems,
        itemHeight: 50,
        containerHeight: 300,
        keyField: 'id',
      },
      slots: {
        default: (props: { item: unknown; index: number }) =>
          h(TestItem, { item: props.item as { id: number; name: string }, index: props.index }),
      },
    });

    // Vue does not expose the key attribute in the DOM, so we just verify
    // the component renders correctly with the keyField prop
    expect(wrapper.find('.virtual-list-container').exists()).toBe(true);
    expect(wrapper.findAll('.virtual-list-item').length).toBeGreaterThan(0);
  });

  it('should expose scroll methods', () => {
    const wrapper = mount(VirtualList, {
      props: {
        items: mockItems,
        itemHeight: 50,
        containerHeight: 300,
      },
      slots: {
        default: (props: { item: unknown; index: number }) =>
          h(TestItem, { item: props.item as { id: number; name: string }, index: props.index }),
      },
    });

    const vm = wrapper.vm as unknown as {
      scrollToIndex: (index: number, behavior?: ScrollBehavior) => void;
      scrollToTop: (behavior?: ScrollBehavior) => void;
      scrollToBottom: (behavior?: ScrollBehavior) => void;
    };

    expect(typeof vm.scrollToIndex).toBe('function');
    expect(typeof vm.scrollToTop).toBe('function');
    expect(typeof vm.scrollToBottom).toBe('function');
  });

  it('should handle empty items array', () => {
    const wrapper = mount(VirtualList, {
      props: {
        items: [],
        itemHeight: 50,
        containerHeight: 300,
      },
      slots: {
        default: (props: { item: unknown; index: number }) =>
          h(TestItem, { item: props.item as { id: number; name: string }, index: props.index }),
      },
    });

    const items = wrapper.findAll('.virtual-list-item');
    expect(items.length).toBe(0);
  });

  it('should handle dynamic height', async () => {
    const wrapper = mount(VirtualList, {
      props: {
        items: mockItems,
        itemHeight: 50,
        containerHeight: 300,
        dynamicHeight: true,
      },
      slots: {
        default: (props: { item: unknown; index: number }) =>
          h(TestItem, { item: props.item as { id: number; name: string }, index: props.index }),
      },
    });

    await nextTick();

    const vm = wrapper.vm as unknown as {
      updateItemHeight: (index: number, height: number) => void;
    };

    expect(typeof vm.updateItemHeight).toBe('function');

    // Update item height
    vm.updateItemHeight(0, 100);
    await nextTick();
  });

  it('should update when items change', async () => {
    const wrapper = mount(VirtualList, {
      props: {
        items: mockItems.slice(0, 10),
        itemHeight: 50,
        containerHeight: 300,
      },
      slots: {
        default: (props: { item: unknown; index: number }) =>
          h(TestItem, { item: props.item as { id: number; name: string }, index: props.index }),
      },
    });

    let phantom = wrapper.find('.virtual-list-phantom');
    expect(phantom.attributes('style')).toContain('height: 500px');

    await wrapper.setProps({
      items: mockItems.slice(0, 20),
    });

    await nextTick();

    phantom = wrapper.find('.virtual-list-phantom');
    expect(phantom.attributes('style')).toContain('height: 1000px');
  });

  it('should apply correct container styles', () => {
    const wrapper = mount(VirtualList, {
      props: {
        items: mockItems,
        itemHeight: 50,
        containerHeight: 400,
      },
      slots: {
        default: (props: { item: unknown; index: number }) =>
          h(TestItem, { item: props.item as { id: number; name: string }, index: props.index }),
      },
    });

    const container = wrapper.find('.virtual-list-container');
    const style = container.attributes('style');
    expect(style).toContain('height: 400px');
    expect(style).toContain('overflow: auto');
  });

  it('should apply correct item styles', () => {
    const wrapper = mount(VirtualList, {
      props: {
        items: mockItems,
        itemHeight: 80,
        containerHeight: 300,
      },
      slots: {
        default: (props: { item: unknown; index: number }) =>
          h('div', { class: 'test-slot' }, (props.item as { name: string }).name),
      },
    });

    const items = wrapper.findAll('.virtual-list-item');
    if (items.length > 0) {
      const style = items[0].attributes('style');
      expect(style).toContain('height: 80px');
    }
  });
});
