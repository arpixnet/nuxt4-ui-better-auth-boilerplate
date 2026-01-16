<script setup lang="ts">
const { t } = useI18n()

// Columnas del footer (links de muestra)
const footerColumns = computed(() => [
  {
    label: t('footer.product'),
    links: [
      {
        label: t('footer.features'),
        to: '#',
        target: '_blank'
      },
      {
        label: t('footer.pricing'),
        to: '#',
        target: '_blank'
      },
      {
        label: t('footer.api'),
        to: '#',
        target: '_blank'
      }
    ]
  },
  {
    label: t('footer.company'),
    links: [
      {
        label: t('footer.about'),
        to: '#',
        target: '_blank'
      },
      {
        label: t('footer.blog'),
        to: '#',
        target: '_blank'
      },
      {
        label: t('footer.careers'),
        to: '#',
        target: '_blank'
      }
    ]
  },
  {
    label: t('footer.resources'),
    links: [
      {
        label: t('footer.docs'),
        to: '#',
        target: '_blank'
      },
      {
        label: t('footer.support'),
        to: '#',
        target: '_blank'
      },
      {
        label: t('footer.status'),
        to: '#',
        target: '_blank'
      }
    ]
  }
])
</script>

<template>
  <UFooter>
    <!-- Columnas del footer -->
    <template #top>
      <UContainer>
        <UFooterColumns :columns="footerColumns" />
      </UContainer>
    </template>
    
    <!-- Copyright y links legales -->
    <template #center>
      <div class="flex flex-col lg:flex-row items-center justify-between gap-3">
        <!-- Copyright -->
        <p class="text-sm text-muted">
          © {{ new Date().getFullYear() }} {{ t('header.title') }}. {{ t('common.footer.copyright') }}
        </p>
        
        <!-- Links legales -->
        <div class="flex items-center gap-4">
          <UButton 
            :label="t('footer.terms')" 
            to="#"
            variant="link"
            color="neutral"
            size="sm"
          />
          <UButton 
            :label="t('footer.privacy')" 
            to="#"
            variant="link"
            color="neutral"
            size="sm"
          />
        </div>
      </div>
    </template>
  </UFooter>
</template>
