<template>
  <v-data-table-server
    :headers="headers"
    :items="tags"
    :items-per-page="itemsPerPage"
    :page="page"
    :items-length="totalTags"
    :loading="loading"
    :items-per-page-options="[10, 25, 50, 100, 250, 500, 1000]"
    @update:options="handleOptionsUpdate"
    multi-sort
    class="elevation-1"
    density="compact"
  >
    <template v-slot:top>
      <v-toolbar flat class="d-print-none">
        <v-btn
          color="blue"
          size="small"
          variant="flat"
          @click="newTagOpenDialog"
        >
          <v-icon>mdi-plus</v-icon>
          {{ $t('admin.tags.newTag') }}
        </v-btn>
        <v-btn color="primary" @click="fetchTags">
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
        <v-divider class="mx-4" inset vertical></v-divider>
        <v-text-field
          density="compact"
          v-model="searchTag"
          v-on:keyup.enter="fetchTags"
          append-icon="mdi-magnify"
          :label="$t('admin.tags.searchTag')"
          hide-details
        ></v-text-field>
        <v-divider class="mx-4" inset vertical></v-divider>
        <v-text-field
          density="compact"
          v-model="searchDescription"
          v-on:keyup.enter="fetchTags"
          append-icon="mdi-magnify"
          :label="$t('admin.tags.searchDescription')"
          hide-details
        ></v-text-field>
        <v-divider class="mx-4" inset vertical></v-divider>
      </v-toolbar>
    </template>

    <template #[`item.value`]="{ item }">
      {{ item.value.toFixed(3) }}
    </template>

    <template #[`item.tag`]="{ item }">
      <span class="text-caption">{{ item.tag }}</span>
    </template>

    <template #[`item.description`]="{ item }">
      <span class="text-caption">{{ item.description }}</span>
    </template>

    <template #[`item.valueJson`]="{ item }">
      <span class="text-caption">{{ item.valueJson }}</span>
    </template>

    <template #[`item.invalid`]="{ item }">
        <v-icon v-if="item.invalid" color="red">mdi-close</v-icon>
        <v-icon v-else color="green">mdi-check</v-icon>
      </template>

    <template v-slot:[`item.Actions`]="{ item }">
      <v-icon size="small" class="me-2" @click="editTagOpenDialog(item)"
        >mdi-pencil</v-icon
      >
      <v-icon size="small" @click="deleteTagOpenDialog(item)"
        >mdi-delete</v-icon
      >
    </template>
  </v-data-table-server>
  <v-chip v-if="error" color="red darken-1">{{ $t('common.error') }}</v-chip>

  <v-dialog scrollable v-model="dialogDeleteTag" max-width="500px">
    <v-card>
      <v-card-title class="headline">{{
        $t('admin.tags.confirmErase')
      }}</v-card-title>
      <v-card-text>
        <v-text-field
          density="compact"
          readonly
          clearable
          variant="outlined"
          v-model="editedTag._id"
          :label="$t('admin.tags.eraseId')"
        ></v-text-field>
        <v-spacer></v-spacer>
        <v-text-field
          density="compact"
          readonly
          variant="outlined"
          v-model="editedTag.tag"
          :label="$t('admin.tags.eraseName')"
        ></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-chip v-if="error" color="red darken-1">{{
          $t('common.error')
        }}</v-chip>
        <v-spacer></v-spacer>
        <v-btn
          color="orange darken-1"
          text
          variant="tonal"
          @click="closeDeleteTag"
          >{{ $t('common.cancel') }}</v-btn
        >
        <v-btn color="red darken-1" text variant="tonal" @click="deleteTag">{{
          $t('common.delete')
        }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog scrollable v-model="dialogEditTag" max-width="750px">
    <v-card>
      <v-card-title>
        <span class="headline">{{
          isNewTag ? $t('admin.tags.newTag') : $t('admin.tags.editTag')
        }}</span>
      </v-card-title>

      <v-card-text>
        <v-text-field
          type="number"
          variant="outlined"
          v-model="editedTag._id"
          :label="$t('admin.tags.editId')"
          :disabled="!isNewTag"
          min="1"
        ></v-text-field>

        <v-text-field
          clearable
          type="text"
          variant="outlined"
          v-model="editedTag.tag"
          :label="$t('admin.tags.editName')"
        ></v-text-field>

        <v-select
          variant="outlined"
          :items="['supervised', 'command', 'calculated', 'manual']"
          :label="$t('admin.tags.editOrigin')"
          v-model="editedTag.origin"
          class="ma-0"
        ></v-select>

        <v-select
          variant="outlined"
          :items="['digital', 'analog', 'string', 'json']"
          :label="$t('admin.tags.editType')"
          v-model="editedTag.type"
          class="ma-0"
        ></v-select>

        <v-expansion-panels variant="inset">
          <v-expansion-panel :title="$t('admin.tags.editDescription')">
            <v-expansion-panel-text>
              <v-text-field
                variant="outlined"
                clearable
                v-model="editedTag.description"
                :label="$t('admin.tags.editDescription')"
              ></v-text-field>
              <v-text-field
                variant="outlined"
                clearable
                v-model="editedTag.ungroupedDescription"
                :label="$t('admin.tags.editUngroupedDescription')"
              ></v-text-field>
              <v-text-field
                variant="outlined"
                clearable
                v-model="editedTag.group1"
                :label="$t('admin.tags.editGroup1')"
              ></v-text-field>
              <v-text-field
                variant="outlined"
                clearable
                v-model="editedTag.group2"
                :label="$t('admin.tags.editGroup2')"
              ></v-text-field>
              <v-text-field
                variant="outlined"
                clearable
                v-model="editedTag.group3"
                :label="$t('admin.tags.editGroup3')"
              ></v-text-field>

              <v-text-field
                variant="outlined"
                clearable
                v-if="editedTag.type == 'digital'"
                v-model="editedTag.stateTextFalse"
                :label="$t('admin.tags.editStateTextFalse')"
              ></v-text-field>
              <v-text-field
                variant="outlined"
                clearable
                v-if="editedTag.type == 'digital'"
                v-model="editedTag.stateTextTrue"
                :label="$t('admin.tags.editStateTextTrue')"
              ></v-text-field>
              <v-text-field
                variant="outlined"
                clearable
                v-if="editedTag.type == 'digital'"
                v-model="editedTag.eventTextFalse"
                :label="$t('admin.tags.editEventTextFalse')"
              ></v-text-field>
              <v-text-field
                variant="outlined"
                clearable
                v-if="editedTag.type == 'digital'"
                v-model="editedTag.eventTextTrue"
                :label="$t('admin.tags.editEventTextTrue')"
              ></v-text-field>
              <v-text-field
                variant="outlined"
                clearable
                v-if="editedTag.type == 'analog'"
                v-model="editedTag.unit"
                :label="$t('admin.tags.editUnit')"
              ></v-text-field>

              <v-text-field
                variant="outlined"
                type="number"
                v-if="editedTag.origin === 'calculated'"
                v-model="editedTag.formula"
                min="0"
                :label="$t('admin.tags.editFormula')"
              ></v-text-field>

              <v-row
                v-if="
                  editedTag.origin === 'calculated' && editedTag.formula > 0
                "
              >
                <v-col>
                  <v-select
                    variant="outlined"
                    v-model="editedTag.parcels"
                    :items="editedTag.parcels"
                    :label="$t('admin.tags.editParcels')"
                    multiple
                  ></v-select>
                </v-col>
                <v-col>
                  <v-btn
                    color="blue darken-1"
                    text
                    variant="tonal"
                    @click="dialogAddParcel = true"
                  >
                    <v-icon dark> mdi-plus </v-icon>
                    {{ $t('admin.tags.parcelAddNew') }}
                  </v-btn>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
          <v-expansion-panel :title="$t('admin.tags.sectionProtocol')">
            <v-expansion-panel-text>
              <v-select
                variant="outlined"
                :items="protocolConnections"
                :label="$t('admin.tags.editProtocolSourceConnectionNumber')"
                :item-title="
                  (item) => `${item.protocolConnectionNumber} | ${item.name}`
                "
                :item-value="(item) => item.protocolConnectionNumber"
                v-if="['supervised', 'command'].includes(editedTag.origin)"
                v-model="editedTag.protocolSourceConnectionNumber"
                class="ma-0"
              ></v-select>

              <v-text-field
                variant="outlined"
                v-if="['supervised', 'command'].includes(editedTag.origin)"
                v-model="editedTag.protocolSourceASDU"
                :label="$t('admin.tags.editProtocolSourceASDU')"
              ></v-text-field>
              <v-text-field
                variant="outlined"
                v-if="['supervised', 'command'].includes(editedTag.origin)"
                v-model="editedTag.protocolSourceCommonAddress"
                :label="$t('admin.tags.editProtocolSourceCommonAddress')"
              ></v-text-field>
              <v-text-field
                variant="outlined"
                v-if="['supervised', 'command'].includes(editedTag.origin)"
                v-model="editedTag.protocolSourceObjectAddress"
                :label="$t('admin.tags.editProtocolSourceObjectAddress')"
              ></v-text-field>
              <v-text-field
                variant="outlined"
                type="number"
                v-if="['supervised'].includes(editedTag.origin)"
                v-model="editedTag.protocolSourcePublishingInterval"
                :label="$t('admin.tags.editProtocolSourcePublishingInterval')"
              ></v-text-field>
              <v-text-field
                variant="outlined"
                type="number"
                v-if="['supervised'].includes(editedTag.origin)"
                v-model="editedTag.protocolSourceSamplingInterval"
                :label="$t('admin.tags.editProtocolSourceSamplingInterval')"
              ></v-text-field>
              <v-text-field
                variant="outlined"
                type="number"
                v-if="['supervised'].includes(editedTag.origin)"
                v-model="editedTag.protocolSourceQueueSize"
                :label="$t('admin.tags.editProtocolSourceQueueSize')"
              ></v-text-field>
              <v-switch
                v-if="['supervised'].includes(editedTag.origin)"
                v-model="editedTag.protocolSourceDiscardOldest"
                inset
                color="primary"
                :label="`${$t('admin.tags.editProtocolSourceDiscardOldest')}${
                  editedTag.protocolSourceDiscardOldest
                    ? $t('common.true')
                    : $t('common.false')
                }`"
                class="mt-0"
              ></v-switch>

              <v-text-field
                variant="outlined"
                type="number"
                v-if="['command'].includes(editedTag.origin)"
                min="0"
                v-model="editedTag.protocolSourceCommandDuration"
                :label="$t('admin.tags.editProtocolSourceCommandDuration')"
              ></v-text-field>

              <v-switch
                v-if="
                  ['command'].includes(editedTag.origin) &&
                  [
                    '45',
                    '46',
                    '47',
                    '58',
                    '59',
                    '60',
                    '0',
                    '1',
                    '2',
                    '3',
                    '4',
                  ].includes('' + editedTag.protocolSourceASDU)
                "
                v-model="editedTag.protocolSourceCommandUseSBO"
                inset
                color="primary"
                :label="`${$t('admin.tags.editProtocolSourceCommandUseSBO')}${
                  editedTag.protocolSourceCommandUseSBO
                    ? $t('admin.tags.editProtocolSourceCommandUseSBOTrue')
                    : $t('admin.tags.editProtocolSourceCommandUseSBOFalse')
                }`"
                class="mt-0"
              ></v-switch>

              <v-text-field
                variant="outlined"
                type="number"
                v-if="['supervised', 'command'].includes(editedTag.origin)"
                v-model="editedTag.kconv1"
                :label="$t('admin.tags.editKconv1')"
              ></v-text-field>
              <v-text-field
                variant="outlined"
                type="number"
                v-if="['supervised', 'command'].includes(editedTag.origin)"
                v-model="editedTag.kconv2"
                :label="$t('admin.tags.editKconv2')"
              ></v-text-field>

              <v-row>
                <v-col>
                  <v-select
                    variant="outlined"
                    v-model="editedTag.protocolDestinations"
                    :items="editedTag.protocolDestinations"
                    :item-title="
                      (item) => `
                            CN:${item.protocolDestinationConnectionNumber} | 
                            OA:${item.protocolDestinationObjectAddress} |
                            CA:${item.protocolDestinationCommonAddress} | 
                            AS:${item.protocolDestinationASDU} 
                            `
                    "
                    :item-value="(item) => item"
                    chips
                    small-chips
                    closable-chips
                    :label="$t('admin.tags.protocolDestinations')"
                    multiple
                  ></v-select>
                </v-col>
                <v-col>
                  <v-btn
                    color="blue darken-1"
                    text
                    variant="tonal"
                    @click="dialogAddProtocolDestination = true"
                  >
                    <v-icon dark> mdi-plus </v-icon>
                    {{ $t('admin.tags.protocolDestinationAddNew') }}
                  </v-btn>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel :title="$t('admin.tags.sectionOtherSettings')">
            <v-expansion-panel-text>
              <v-text-field
                variant="outlined"
                type="number"
                v-model="editedTag.priority"
                min="0"
                max="3"
                :label="$t('admin.tags.editPriority')"
              ></v-text-field>

              <v-select
                variant="outlined"
                v-if="editedTag.type == 'digital'"
                :items="alarmStateItems"
                item-title="name"
                item-value="value"
                :label="$t('admin.tags.editAlarmState')"
                v-model="editedTag.alarmState"
                class="ma-0"
              ></v-select>

              <v-switch
                v-if="['supervised'].includes(editedTag.origin)"
                v-model="editedTag.isEvent"
                inset
                color="primary"
                :label="`${$t('admin.tags.editIsEvent')}${
                  editedTag.isEvent
                    ? $t('admin.tags.editIsEventTrue')
                    : $t('admin.tags.editIsEventFalse')
                }`"
                class="mt-0"
              ></v-switch>

              <v-text-field
                variant="outlined"
                type="number"
                v-if="['supervised'].includes(editedTag.origin)"
                v-model="editedTag.commandOfSupervised"
                :label="$t('admin.tags.editCommandOfSupervised')"
              ></v-text-field>

              <v-text-field
                variant="outlined"
                type="number"
                v-if="['command'].includes(editedTag.origin)"
                v-model="editedTag.supervisedOfCommand"
                :label="$t('admin.tags.editSupervisedOfCommand')"
              ></v-text-field>

              <v-text-field
                variant="outlined"
                type="number"
                v-if="['supervised'].includes(editedTag.origin)"
                v-model="editedTag.invalidDetectTimeout"
                :label="$t('admin.tags.editInvalidDetectTimeout')"
              ></v-text-field>

              <v-text-field
                variant="outlined"
                type="number"
                v-if="editedTag.type === 'analog'"
                v-model="editedTag.frozenDetectTimeout"
                :label="$t('admin.tags.editFrozenDetectTimeout')"
              ></v-text-field>

              <v-text-field
                variant="outlined"
                type="number"
                v-if="
                  editedTag.origin !== 'command' && editedTag.type === 'analog'
                "
                min="0"
                v-model="editedTag.historianDeadBand"
                :label="$t('admin.tags.editHistorianDeadBand')"
              ></v-text-field>

              <v-text-field
                variant="outlined"
                type="number"
                v-if="editedTag.origin !== 'command'"
                min="0"
                v-model="editedTag.historianPeriod"
                :label="$t('admin.tags.editHistorianPeriod')"
              ></v-text-field>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card-text>

      <v-card-actions>
        <v-chip v-if="error" color="red darken-1">{{
          $t('common.error')
        }}</v-chip>
        <v-spacer></v-spacer>
        <v-btn
          color="orange darken-1"
          text
          variant="tonal"
          @click="closeEditTag"
        >
          {{ $t('common.cancel') }}
        </v-btn>
        <v-btn
          color="blue darken-1"
          text
          variant="tonal"
          @click="updateOrCreateTag"
        >
          {{ $t('common.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog
    scrollable
    v-model="dialogAddProtocolDestination"
    max-width="400"
    class="pa-8"
  >
    <v-card>
      <v-card-title class="headline">
        {{ $t('admin.tags.protocolDestinationAddNew') }}
      </v-card-title>

      <v-card-text>
        <v-select
          :items="protocolConnectionsDestinations"
          :label="$t('admin.tags.protocolDestinationConnectionNumber')"
          :item-title="
            (item) => `${item.protocolConnectionNumber} | ${item.name}`
          "
          :item-value="(item) => item.protocolConnectionNumber"
          v-model="newProtocolDestination.protocolDestinationConnectionNumber"
          class="ma-0"
        ></v-select>

        <v-text-field
          :label="$t('admin.tags.protocolDestinationCommonAddress')"
          v-model="newProtocolDestination.protocolDestinationCommonAddress"
        ></v-text-field>

        <v-text-field
          :label="$t('admin.tags.protocolDestinationObjectAddress')"
          v-model="newProtocolDestination.protocolDestinationObjectAddress"
        ></v-text-field>

        <v-text-field
          :label="$t('admin.tags.protocolDestinationASDU')"
          v-model="newProtocolDestination.protocolDestinationASDU"
        ></v-text-field>

        <v-text-field
          v-if="
            !isNaN(parseInt(newProtocolDestination.protocolDestinationASDU)) &&
            newProtocolDestination.protocolDestinationASDU >= 45 &&
            newProtocolDestination.protocolDestinationASDU <= 64
          "
          :label="$t('admin.tags.protocolDestinationCommandDuration')"
          type="number"
          min="0"
          v-model="newProtocolDestination.protocolDestinationCommandDuration"
        ></v-text-field>

        <v-switch
          v-if="
            newProtocolDestination.protocolDestinationASDU >= 45 &&
            newProtocolDestination.protocolDestinationASDU <= 64
          "
          v-model="newProtocolDestination.protocolDestinationCommandUseSBO"
          inset
          color="primary"
          :label="`${$t('admin.tags.protocolDestinationCommandUseSBO')}${
            newProtocolDestination.protocolDestinationCommandUseSBO
              ? ': ' + $t('common.true')
              : ': ' + $t('common.false')
          }`"
          class="mt-n3"
        ></v-switch>

        <v-text-field
          :label="$t('admin.tags.protocolDestinationKConv1')"
          type="number"
          v-model="newProtocolDestination.protocolDestinationKConv1"
        ></v-text-field>

        <v-text-field
          :label="$t('admin.tags.protocolDestinationKConv2')"
          type="number"
          v-model="newProtocolDestination.protocolDestinationKConv2"
        ></v-text-field>

        <v-text-field
          :label="$t('admin.tags.protocolDestinationGroup')"
          v-model="newProtocolDestination.protocolDestinationGroup"
        ></v-text-field>

        <v-text-field
          :label="$t('admin.tags.protocolDestinationHoursShift')"
          type="number"
          v-model="newProtocolDestination.protocolDestinationHoursShift"
        ></v-text-field>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="orange darken-1"
          text
          variant="tonal"
          @click="dialogAddProtocolDestination = false"
        >
          {{ $t('common.cancel') }}
        </v-btn>
        <v-btn
          color="blue darken-1"
          text
          variant="tonal"
          @click="addNewProtocolDestination"
        >
          {{ $t('common.ok') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog scrollable v-model="dialogAddParcel" max-width="400" class="pa-8">
    <v-card>
      <v-card-title class="headline">
        {{ $t('admin.tags.parcelAddNew') }}
      </v-card-title>

      <v-card-text>
        <v-text-field
          :label="$t('admin.tags.parcelNew')"
          type="number"
          min="0"
          v-model="newParcel"
        ></v-text-field>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="orange darken-1"
          text
          variant="tonal"
          @click="dialogAddParcel = false"
        >
          {{ $t('common.cancel') }}
        </v-btn>
        <v-btn color="blue darken-1" text variant="tonal" @click="addNewParcel">
          {{ $t('common.ok') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
  import { ref, reactive, computed, nextTick, onMounted } from 'vue'
  import { useI18n } from 'vue-i18n'

  const { t } = useI18n()

  const defaultTagValue = ref({
    tag: '',
    description: '',
    ungroupedDescription: '',
    group1: '',
    group2: '',
    group3: '',
    stateTextFalse: '',
    stateTextTrue: '',
    eventTextFalse: '',
    eventTextTrue: '',
    unit: '',
    origin: 'supervised',
    type: 'digital',
    commandOfSupervised: 0,
    supervisedOfCommand: 0,
    invalidDetectTimeout: 3600,
    frozenDetectTimeout: 0,
    formula: 0,
    priority: 0,
    parcels: [],
    protocolDestinations: [],
    protocolSourceASDU: '',
    protocolSourceCommonAddress: '',
    protocolSourceObjectAddress: '',
    protocolSourceCommandDuration: 0,
    protocolSourceCommandUseSBO: false,
    protocolSourcePublishingInterval: 5.0,
    protocolSourceSamplingInterval: 5.0,
    protocolSourceQueueSize: 5.0,
    protocolSourceDiscardOldest: true,
    historianDeadBand: 0,
    historianPeriod: 0,
    alarmState: 2,
    kconv1: 1,
    kconv2: 0,
    isEvent: false,
    location: {},
  })
  const editedTag = ref({ ...defaultTagValue.value })
  const dialogEditTag = ref(false)
  const dialogDeleteTag = ref(false)
  const dialogAddParcel = ref(false)
  const isNewTag = ref(false)
  const tags = ref([])
  const protocolConnections = ref([])
  const protocolDriveNameByConnNumber = ref([])
  const protocolConnectionsDestinations = ref([])
  const totalTags = ref(0)
  const searchTag = ref('')
  const searchDescription = ref('')
  const loading = ref(true)
  const itemsPerPage = ref(10)
  const page = ref(1)
  const sortBy = ref([])
  const sortDesc = ref([])
  const dialogAddProtocolDestination = ref(false)
  const newParcel = ref(0)
  const error = ref(false)
  const newProtocolDestination = ref({
    protocolDestinationConnectionNumber: 0,
    protocolDestinationCommonAddress: 0,
    protocolDestinationObjectAddress: 0,
    protocolDestinationASDU: 0,
    protocolDestinationCommandDuration: 0,
    protocolDestinationCommandUseSBO: false,
    protocolDestinationKConv1: 1,
    protocolDestinationKConv2: 0,
    protocolDestinationGroup: 0,
    protocolDestinationHoursShift: 0,
  })

  const alarmStateItems = ref([
    {
      value: 0,
      name: t('admin.tags.editAlarmStateOff'),
    },
    {
      value: 1,
      name: t('admin.tags.editAlarmStateOn'),
    },
    {
      value: 2,
      name: t('admin.tags.editAlarmStateBoth'),
    },
    {
      value: 3,
      name: t('admin.tags.editAlarmStateOffToOn'),
    },
    {
      value: -1,
      name: t('admin.tags.editAlarmStateNone'),
    },
  ])

  const headers = computed(() => [
    {
      title: t('admin.tags.headers.tag'),
      align: 'start',
      sortable: true,
      key: 'tag',
    },
    {
      title: t('admin.tags.headers.id'),
      sortable: true,
      key: '_id',
    },
    {
      title: t('admin.tags.headers.protocolSourceConnectionNumber'),
      sortable: true,
      key: 'protocolSourceConnectionNumber',
    },
    {
      title: t('admin.tags.headers.type'),
      sortable: true,
      key: 'type',
    },
    {
      title: t('admin.tags.headers.group1'),
      sortable: true,
      key: 'group1',
    },
    {
      title: t('admin.tags.headers.description'),
      sortable: true,
      key: 'description',
    },
    { title: t('admin.tags.headers.valueNumeric'), key: 'value', align: 'end' },
    { title: t('admin.tags.headers.valueJson'), key: 'valueJson' },
    { title: t('admin.tags.headers.valueString'), key: 'valueString' },
    { title: t('admin.tags.headers.quality'), key: 'invalid' },
    {
      title: t('admin.tags.headers.actions'),
      key: 'Actions',
      sortable: false,
    },
  ])

  const handleOptionsUpdate = (newOptions) => {
    page.value = newOptions.page
    itemsPerPage.value = newOptions.itemsPerPage
    sortBy.value = newOptions.sortBy
    sortDesc.value = newOptions.sortDesc
    fetchTags()
  }

  const newTagOpenDialog = async () => {
    isNewTag.value = true
    editedTag.value = Object.assign({}, defaultTagValue.value)
    await fetchProtocolConnections()
    dialogEditTag.value = true
  }

  const editTagOpenDialog = async (item) => {
    isNewTag.value = false
    editedTag.value = Object.assign({}, item)
    await fetchProtocolConnections()
    dialogEditTag.value = true
  }

  const deleteTagOpenDialog = (item) => {
    editedTag.value = Object.assign({}, item)
    dialogDeleteTag.value = true
  }

  const deleteTag = async () => {
    try {
      const response = await fetch('/Invoke/auth/deleteTag', {
        method: 'post',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tag: editedTag.value.tag,
          _id: editedTag.value._id,
        }),
      })
      const json = await response.json()
      if (json.error) {
        setError(json)
        return
      }
      dialogDeleteTag.value = false
    } catch (err) {
      setError(err)
    }
    fetchTags()
  }

  const closeEditTag = () => {
    dialogEditTag.value = false
    fetchTags()
  }

  const closeDeleteTag = () => {
    dialogDeleteTag.value = false
  }

  const updateOrCreateTag = async () => {
    if (isNewTag.value) {
      await createTag()
    } else {
      await updateTag()
    }
  }

  const createTag = async () => {
    try {
      const response = await fetch('/Invoke/auth/createTag', {
        method: 'post',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedTag.value),
      })
      const json = await response.json()
      if (json.error || !json._id) {
        setError(json)
        return
      }
      dialogEditTag.value = false
    } catch (err) {
      setError(err)
    }
    fetchTags()
  }

  const updateTag = async () => {
    try {
      const response = await fetch('/Invoke/auth/updateTag', {
        method: 'post',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedTag.value),
      })
      const json = await response.json()
      if (json.error) {
        setError(json)
        return
      }
      closeEditTag()
    } catch (err) {
      setError(err)
    }
    fetchTags()
  }

  const fetchTags = async () => {
    let filter = {}

    if (searchTag.value.trim() !== '')
      filter.tag = { $regex: searchTag.value, $options: 'i' }
    if (searchDescription.value.trim() !== '')
      filter.description = { $regex: searchDescription.value, $options: 'i' }

    loading.value = true
    try {
      const response = await fetch('/Invoke/auth/listTags', {
        method: 'post',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemsPerPage: itemsPerPage.value,
          sortBy: sortBy.value,
          sortDesc: sortDesc.value,
          page: page.value,
          filter: filter,
        }),
      })
      const json = await response.json()
      tags.value = json.tags
      totalTags.value = json.countTotal
    } catch (err) {
      setError(err)
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    fetchTags()
  })

  const fetchProtocolConnections = async () => {
    try {
      const response = await fetch('/Invoke/auth/listProtocolConnections')
      const json = await response.json()
      for (let i = 0; i < json.length; i++) {
        json[i].id = i + 1
      }
      protocolConnections.value = json
      protocolConnectionsDestinations.value = []
      protocolConnections.value.forEach((item) => {
        if (
          item.protocolDriver === 'OPC-UA_SERVER' ||
          item.protocolDriver === 'IEC60870-5-104_SERVER' ||
          item.protocolDriver === 'IEC60870-5-101_SERVER'
        ) {
          protocolConnectionsDestinations.value.push(item)
        }
        protocolDriveNameByConnNumber[item.protocolConnectionNumber] = item.name
      })
    } catch (err) {
      setError(err)
    }
  }

  const addNewProtocolDestination = async () => {
    if (!isNaN(parseInt(newProtocolDestination.value.protocolDestinationObjectAddress))) {
      newProtocolDestination.value.protocolDestinationObjectAddress = parseInt(newProtocolDestination.value.protocolDestinationObjectAddress)
    }
    if (!isNaN(parseInt(newProtocolDestination.value.protocolDestinationCommonAddress))) {
      newProtocolDestination.value.protocolDestinationCommonAddress = parseInt(newProtocolDestination.value.protocolDestinationCommonAddress)
    }
    if (!isNaN(parseInt(newProtocolDestination.value.protocolDestinationASDU))) {
      newProtocolDestination.value.protocolDestinationASDU = parseInt(newProtocolDestination.value.protocolDestinationASDU)
    }
    if (!isNaN(parseInt(newProtocolDestination.value.protocolDestinationCommandDuration))) {
      newProtocolDestination.value.protocolDestinationCommandDuration = parseInt(newProtocolDestination.value.protocolDestinationCommandDuration)
    }
    if (!isNaN(parseInt(newProtocolDestination.value.protocolDestinationGroup))) {
      newProtocolDestination.value.protocolDestinationGroup = parseInt(newProtocolDestination.value.protocolDestinationGroup)
    }
    editedTag.value.protocolDestinations.push(newProtocolDestination.value)
    dialogAddProtocolDestination.value = false
  }

  const addNewParcel = async () => {
    editedTag.value.parcels.push(newParcel.value)
    dialogAddParcel.value = false
  }

  const setError = (err) => {
    error.value = true
    console.warn(err)
    setTimeout(() => {
      error.value = false
    }, 2000)
  }

  defineExpose({ fetchTags })
</script>
