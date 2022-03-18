import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, OneToMany as OneToMany_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"
import {Contributor} from "./contributor.model"
import {Parachain} from "./parachain.model"
import {CrowdloanStatus} from "./_crowdloanStatus"

@Entity_()
export class Crowdloan {
  constructor(props?: Partial<Crowdloan>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  cap!: bigint

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  firstPeriod!: bigint

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  lastPeriod!: bigint

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  end!: bigint

  @OneToMany_(() => Contributor, e => e.crowdloan)
  contributors!: Contributor[]

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  raised!: bigint

  @Index_()
  @ManyToOne_(() => Parachain, {nullable: false})
  parachain!: Parachain

  @Index_()
  @Column_("text", {nullable: false})
  chainName!: string

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: true})
  blockNumber!: bigint | undefined | null

  @Column_("varchar", {length: 9, nullable: true})
  status!: CrowdloanStatus | undefined | null
}
