<template>
  <v-card>
    <v-row class="pa-4" justify="space-between">
      <v-col>
        <v-treeview
          style="max-height: 500px; min-width: 250px"
          class="overflow-y-auto overflow-x-hidden"
          :active.sync="active"
          :items="items"
          :load-children="fetchDriverInstances"
          :open.sync="open"
          activatable
          color="primary"
          open-on-click
          transition
          open-all
        >
          <template v-slot:prepend="{ item }">
            <v-icon v-if="!item.children"> mdi-play-circle </v-icon>
            {{ item.driverNameInstance }}
          </template>
        </v-treeview>
        <v-btn
          class="mt-6"
          dark
          x-small
          color="blue"
          @click="createDriverInstance($event)"
        >
          <v-icon dark> mdi-plus </v-icon>
          {{ $t("src\\components\\driverInstances.newDriverInstance") }}
        </v-btn>
      </v-col>

      <v-divider vertical></v-divider>

      <v-col class="d-flex text-center">
        <v-scroll-y-transition mode="out-in">
          <div
            v-if="!selected"
            class="title grey--text text--lighten-1 font-weight-light"
            style="align-self: center"
          >
            {{ $t("src\\components\\driverInstances.selectDriverInstance") }}
          </div>
          <v-card v-else :key="selected.id" class="pt-6 mx-auto" flat>
            <v-row class="mx-auto flex-nowrap" justify="space-between">
              <v-select
                prepend-inner-icon="mdi-cogs"
                :items="driverNameItems"
                :label="$t('src\\components\\driverInstances.protocolDriver')"
                v-model="selected.protocolDriver"
                outlined
                @change="updateProtocolDriverInstance"
              ></v-select>

              <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                    v-bind="attrs"
                    v-on="on"
                    class="mx-2"
                    fab
                    dark
                    x-small
                    color="red"
                    @click="dialogDelInst = true"
                  >
                    <v-icon dark> mdi-minus </v-icon>
                  </v-btn>
                </template>
                <span>{{
                  $t("src\\components\\driverInstances.deleteDriverInstance")
                }}</span>
              </v-tooltip>

              <v-dialog v-model="dialogDelInst" max-width="290">
                <v-card>
                  <v-card-title class="headline">
                    {{
                      $t(
                        "src\\components\\driverInstances.deleteDriverInstance"
                      )
                    }}
                  </v-card-title>

                  <v-card-text>
                    {{
                      $t(
                        "src\\components\\driverInstances.deleteDriverInstanceConfirm"
                      )
                    }}
                  </v-card-text>

                  <v-card-actions>
                    <v-spacer></v-spacer>

                    <v-btn
                      color="green darken-1"
                      text
                      @click="dialogDelInst = false"
                    >
                      {{
                        $t(
                          "src\\components\\driverInstances.deleteDriverInstanceCancel"
                        )
                      }}
                    </v-btn>

                    <v-btn
                      color="red darken-1"
                      text
                      @click="
                        dialogDelInst = false;
                        deleteDriverInstance($event);
                      "
                    >
                      {{
                        $t(
                          "src\\components\\driverInstances.deleteDriverInstanceExecute"
                        )
                      }}
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-dialog>
            </v-row>

            <v-switch
              v-model="selected.enabled"
              inset
              color="primary"
              :label="`${$t('src\\components\\driverInstances.enabled')}${
                selected.enabled
                  ? $t('src\\components\\driverInstances.enabledTrue')
                  : $t('src\\components\\driverInstances.enabledFalse')
              }`"
              @change="updateProtocolDriverInstance"
            ></v-switch>

            <v-text-field
              class="pb-8"
              prepend-inner-icon="mdi-play-circle"
              type="number"
              outlined
              min="1"
              clearable
              :input-value="active"
              :label="$t('src\\components\\driverInstances.instanceNumber')"
              hide-details="auto"
              v-model="selected.protocolDriverInstanceNumber"
              @change="updateProtocolDriverInstance"
            ></v-text-field>

            <v-text-field
              class="pb-8"
              prepend-inner-icon="mdi-information"
              type="number"
              outlined
              clearable
              :input-value="active"
              :label="$t('src\\components\\driverInstances.logLevel')"
              min="0"
              max="3"
              hide-details="auto"
              v-model="selected.logLevel"
              @change="updateProtocolDriverInstance"
            ></v-text-field>

            <v-autocomplete
              v-model="selected.nodeNames"
              :items="nodeNames"
              outlined
              chips
              small-chips
              deletable-chips
              :label="$t('src\\components\\driverInstances.allowedNodesList')"
              multiple
              @change="updateProtocolDriverInstance"
            ></v-autocomplete>

            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  v-bind="attrs"
                  v-on="on"
                  class="mx-2"
                  fab
                  dark
                  x-small
                  color="blue"
                  @click="dialogAddNode = true"
                >
                  <v-icon dark> mdi-plus </v-icon>
                </v-btn>
              </template>
              <span>{{
                $t("src\\components\\driverInstances.addNewNode")
              }}</span>
            </v-tooltip>
            <v-dialog v-model="dialogAddNode" max-width="400" class="pa-8">
              <v-card>
                <v-card-title class="headline">{{
                  $t("src\\components\\driverInstances.addNewNode")
                }}</v-card-title>

                <v-card-title class="headline">
                  <v-text-field
                    :label="$t('src\\components\\driverInstances.newNodeName')"
                    v-model="newNode"
                  ></v-text-field>
                </v-card-title>

                <v-card-actions>
                  <v-spacer></v-spacer>

                  <v-btn
                    color="green darken-1"
                    text
                    @click="dialogAddNode = false"
                  >
                    {{
                      $t("src\\components\\driverInstances.addNewNodeCancel")
                    }}
                  </v-btn>

                  <v-btn
                    color="blue darken-1"
                    text
                    @click="
                      dialogAddNode = false;
                      addNewNode($event);
                    "
                  >
                    {{
                      $t("src\\components\\driverInstances.addNewNodeExecute")
                    }}
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </v-card>
        </v-scroll-y-transition>
      </v-col>
    </v-row>
  </v-card>
</template>

<script>
import i18n from "../i18n.js";

export default {
  name: "ProtocolDriversInstances",

  data: () => ({
    dialogAddNode: false,
    dialogDelInst: false,
    active: [],
    open: [],
    newNode: "",
    driverNameItems: [
      "IEC60870-5-104",
      "IEC60870-5-104_SERVER",
      "IEC60870-5-101",
      "IEC60870-5-101_SERVER",
      "IEC61850",
      "IEC61850_SERVER",
      "DNP3",
      "DNP3_SERVER",
      "MQTT-SPARKPLUG-B",
      "OPC-UA",
      "OPC-UA_SERVER",
      "OPC-DA",
      "OPC-DA_SERVER",
      "PLCTAG",
      "PLC4X",
      "TELEGRAF-LISTENER",
      "ICCP",
      "ICCP_SERVER",
      "I104M",
      "PI_DATA_ARCHIVE_INJECTOR",
      "PI_DATA_ARCHIVE_CLIENT",
    ],
    driverInstances: [],
  }),

  computed: {
    items() {
      return [
        {
          name: i18n.t("src\\components\\driverInstances.driverInstances"),
          children: this.driverInstances,
        },
      ];
    },
    selected() {
      if (!this.active.length) return undefined;

      const id = this.active[0];

      return this.driverInstances.find((elem) => elem.id === id);
    },
  },

  watch: {
    // selected: "randomAvatar",
  },

  methods: {
    async addNewNode() {
      if (
        this.newNode != "" &&
        !this.selected.nodeNames.includes(this.newNode)
      ) {
        this.selected.nodeNames.push(this.newNode);
        this.updateProtocolDriverInstance();
        this.newNode = "";
        this.fetchNodes();
      }
    },
    async updateProtocolDriverInstance() {
      var driverInstDup = Object.assign({}, this.selected);
      delete driverInstDup["id"];
      return await fetch("/Invoke/auth/updateProtocolDriverInstance", {
        method: "post",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(driverInstDup),
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.error) console.log(json);
          this.fetchDriverInstances(); // refreshes driver instances
        })
        .catch((err) => console.warn(err));
    },
    async createDriverInstance() {
      return await fetch("/Invoke/auth/createProtocolDriverInstance", {
        method: "post",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.error) console.log(json);
          this.fetchDriverInstances(); // refreshes instances
        })
        .catch((err) => console.warn(err));
    },
    async fetchNodes() {
      return await fetch("/Invoke/auth/listNodes")
        .then((res) => res.json())
        .then((json) => {
          this.nodeNames = json;
        })
        .catch((err) => console.warn(err));
    },
    async fetchDriverInstances() {
      this.fetchNodes();
      return await fetch("/Invoke/auth/listProtocolDriverInstances")
        .then((res) => res.json())
        .then((json) => {
          for (let i = 0; i < json.length; i++) {
            json[i].id = i + 1;
            json[i].driverNameInstance =
              json[i].protocolDriver +
              " ( " +
              json[i].protocolDriverInstanceNumber +
              " )";
          }
          this.driverInstances.length = 0;
          this.driverInstances.push(...json);
        })
        .catch((err) => console.warn(err));
    },
    async deleteDriverInstance() {
      return await fetch("/Invoke/auth/deleteProtocolDriverInstance", {
        method: "post",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          protocolDriver: this.selected.protocolDriver,
          protocolDriverInstanceNumber:
            this.selected.protocolDriverInstanceNumber,
          _id: this.selected._id,
        }),
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.error) console.log(json);
          this.fetchDriverInstances(); // refreshes instances
        })
        .catch((err) => console.warn(err));
    },
  },
};
</script>