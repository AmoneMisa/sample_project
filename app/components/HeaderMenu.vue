<script setup lang="ts">
const {t} = useI18n();

const menu = [
  {
    type: "simple",
    label: "menu.home",
    href: "/"
  },
  {
    type: "dropdown-simple",
    label: "menu.tools",
    items: [
      {label: "menu.textGenerator", badge: "badge.cool", href: "/text"},
      {label: "menu.imageGenerator", href: "/image"},
      {label: "menu.codeGenerator", badge: "badge.discount", href: "/code"}
    ]
  },
  {
    type: "dropdown-mega",
    label: "menu.pages",
    columns: [
      {
        title: "menu.innerPages",
        items: [
          {label: "menu.blog", href: "/blog"},
          {label: "menu.pricing", href: "/pricing"}
        ]
      },
      {
        title: "menu.dashboard",
        items: [
          {label: "menu.profile", href: "/profile"},
          {label: "menu.sessions", badge: "badge.easyToBuy", href: "/sessions"}
        ]
      }
    ],
    image: {
      src: "/images/menu-img-2.png",
      position: "right"
    }
  }
];
</script>

<template>
  <nav class="header-menu">
    <ul class="header-menu__list">
      <li v-for="(item, i) in menu"
          :key="i"
          class="header-menu__item"
          :class="{
        'header-menu__item_dropdown-simple': item.type === 'dropdown-simple',
        'header-menu__item_dropdown-mega': item.type === 'dropdown-mega'
      }"
      >
        <a
            v-if="item.type === 'simple'"
            class="header-menu__link"
            :href="item.href"
        >
          {{ t(item.label) }}
        </a>
        <div v-else-if="item.type === 'dropdown-simple'" class="header-menu__trigger">
        <span class="header-menu__link">
            {{ t(item.label) }}
        </span>

          <ul class="header-menu__dropdown">
            <li
                v-for="(sub, j) in item.items"
                :key="j"
                class="header-menu__dropdown-item"
            >
              <a class="header-menu__dropdown-link" :href="sub.href">
                {{ t(sub.label) }} <span v-if="sub.badge" class="header-menu__badge line-clamp-1">{{ t(sub.badge) }}</span>
              </a>
            </li>
          </ul>
        </div>
        <div v-else-if="item.type === 'dropdown-mega'" class="header-menu__trigger">
        <span class="header-menu__link">
            {{ t(item.label) }}
        </span>
          <div class="header-menu__mega">
            <div
                v-for="(col, c) in item.columns"
                :key="c"
                class="header-menu__mega-column"
            >
              <h3 class="header-menu__mega-title">{{ t(col.title) }}</h3>

              <ul class="header-menu__mega-list">
                <li
                    v-for="(sub, s) in col.items"
                    :key="s"
                    class="header-menu__mega-item"
                >
                  <a class="header-menu__mega-link" :href="sub.href">
                    {{ t(sub.label) }} <span v-if="sub.badge" class="header-menu__badge line-clamp-1">{{ t(sub.badge) }}</span>
                  </a>
                </li>
              </ul>
            </div>
            <div
                v-if="item.image"
                class="header-menu__mega-image"
                :class="{
              'header-menu__mega-image_right': item.image.position === 'right',
              'header-menu__mega-image_left': item.image.position === 'left'
            }"
            >
              <img :src="item.image.src" alt=""/>
            </div>
          </div>
        </div>
      </li>
    </ul>
  </nav>
</template>

<style scoped lang="scss">
.header__menu {
  margin: 0;
  padding: 0 16px;
  border: 1px solid var(--ui-border);
  border-radius: 50px;
  background: var(--color-blackest);
  max-height: 52px;

  ul li > a,
  ul li > button {
    position: relative;
    padding: 13px 17px;
    font-size: 16px;
    font-weight: 500;
    color: var(--color-link);
    transition: color 0.3s ease;

    &::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      margin: 0 auto;
      width: 0;
      height: 4px;
      background: linear-gradient(
              90deg,
              var(--color-primary-gradient-start),
              var(--color-primary-gradient-end)
      );
      border-radius: 12px;
      opacity: 0;
      transition: 0.3s ease;
      z-index: 1;
    }

    &:hover::after {
      opacity: 1;
      width: 45px;
    }
  }
}

.header-menu__list {
  display: flex;
  padding: 0 16px;
  margin: 0;
  list-style: none;
  border: 1px solid var(--ui-border);
  border-radius: 50px;
  background: var(--color-blackest);
  max-height: 52px;
  position: relative;
}

.header-menu__item {
  position: relative;
}

.header-menu__link {
  padding: 13px 17px;
  font-size: 16px;
  font-weight: 500;
  color: var(--color-link);
  transition: color 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  background: transparent;
  border: none;
}

.header-menu__link::before {
  content: "";
  position: absolute;
  left: 50%;
  top: 75%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 8px;
  background: linear-gradient(
          90deg,
          var(--color-primary-gradient-start),
          var(--color-primary-gradient-end)
  );
  border-radius: 100%;
  filter: blur(16px);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 0;
}

.header-menu__link::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  margin: 0 auto;
  width: 0;
  height: 4px;
  background: linear-gradient(
          90deg,
          var(--color-primary-gradient-start),
          var(--color-primary-gradient-end)
  );
  border-radius: 12px;
  opacity: 0;
  transition: 0.3s ease;
  z-index: 1;
}

.header-menu__link:hover::before,
.header-menu__link:hover::after,
.header-menu__trigger:hover::before,
.header-menu__trigger:hover::after {
  opacity: 1;
}

.header-menu__link:hover::after,
.header-menu__trigger:hover::after {
  width: 45px;
}

.header-menu__dropdown {
  position: absolute;
  width: 300px;
  top: 100%;
  left: 0;
  padding: 12px;
  background: var(--color-blackest);
  border: 1px solid var(--ui-border);
  border-radius: 12px;
  list-style: none;
  opacity: 0;
  visibility: hidden;
  transition: 0.3s ease;
  transform: translateX(-50%);

  li a {
    font-weight: 500;
    padding: 5px 14px;
    font-size: 15px;
    color: var(--color-link);
    border-radius: 4px;
    display: flex;
    align-items: center;
  }
}

.header-menu__item_dropdown-simple:hover .header-menu__dropdown {
  opacity: 1;
  visibility: visible;
}

.header-menu__dropdown-item {
  margin: 0;

  &:hover {
    .header-menu__dropdown-link {
      color: var(--color-white);
      background-color: var(--color-darker);
    }
  }
}

.header-menu__mega-item {
  margin: 0;

  &:hover {
    .header-menu__mega-link {
      color: var(--color-white);
      background-color: var(--color-darker);
    }
  }
}

.header-menu__dropdown-link,
.header-menu__mega-link {
  display: block;
  padding: 10px 20px;
  color: var(--color-link);
  transition: all 0.3s ease;
}

.header-menu__mega {
  position: absolute;
  top: 100%;
  left: 0;
  display: flex;
  gap: 40px;
  padding: 16px;
  background: var(--color-blackest);
  border: 1px solid var(--ui-border);
  border-radius: 16px;
  opacity: 0;
  visibility: hidden;
  transition: 0.3s ease;
  transform: translateX(-50%);
  overflow: hidden;

  li a {
    font-weight: 500;
    padding: 5px 14px;
    font-size: 15px;
    color: var(--color-link);
    border-radius: 4px;
    display: flex;
    align-items: center;
  }
}

.header-menu__item_dropdown-mega:hover .header-menu__mega {
  opacity: 1;
  visibility: visible;
}

.header-menu__mega-column {
  min-width: 180px;
}

.header-menu__mega-title {
  font-size: 12px;
  font-weight: 600;
  padding: 15px 12px;
  text-align: left;
  margin-bottom: 15px;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-link);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.5;
  border-bottom: 1px solid var(--color-border);
}

.header-menu__mega-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.header-menu__mega-image {
  display: flex;
  align-items: center;
  max-height: 460px;
  margin: -16px;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;

  img {
    width: -webkit-fill-available;
    height: auto;
    min-width: 240px;
  }
}

.header-menu__mega-image_right {
  order: 99;
}

.header-menu__mega-image_left {
  order: -1;
}

.header-menu__badge {
  background: linear-gradient(to right, var(--color-primary-gradient-start), var(--color-primary-gradient-end));
  padding: 2px 8px;
  border-radius: 100px;
  color: var(--color-white);
  font-size: 10px;
  font-weight: 500;
  position: relative;
  z-index: 2;
  letter-spacing: 0.5px;
  line-height: 13px;
  text-transform: uppercase;
  margin-left: 5px;
}
</style>