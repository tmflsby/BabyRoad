import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SysDept } from './entities/sys-dept.entity';
import { CreateDeptDto } from './dto/create-dept.dto';
import { UpdateDeptDto } from './dto/update-dept.dto';
import { buildTree } from '../../../utils';

/** 部门树节点：在实体基础上挂载子部门集合 */
export interface DeptTreeNode extends SysDept {
  children?: DeptTreeNode[];
}

@Injectable()
export class DeptService {
  constructor(
    @InjectRepository(SysDept)
    private readonly deptRepository: Repository<SysDept>,
  ) {}

  /**
   * 查询部门列表，并以树形结构返回（仅未逻辑删除的部门）
   */
  async list(): Promise<DeptTreeNode[]> {
    const depts = await this.deptRepository.find({
      where: { delFlag: 0 },
      order: { parentId: 'ASC', sortOrder: 'ASC', id: 'ASC' },
    });
    return buildTree<DeptTreeNode>(
      depts,
      (dept) => dept.id,
      (dept) => dept.parentId,
    );
  }

  /**
   * 新增部门：校验父部门合法性并计算祖级列表(ancestors)
   */
  async create(dto: CreateDeptDto, operator: string): Promise<SysDept> {
    const parentId = dto.parentId ?? 0;
    const ancestors = await this.resolveAncestors(parentId);

    const dept = this.deptRepository.create({
      parentId,
      ancestors,
      deptName: dto.deptName,
      sortOrder: dto.sortOrder ?? 0,
      leader: dto.leader ?? '',
      phone: dto.phone ?? '',
      email: dto.email ?? '',
      isEnabled: dto.isEnabled ?? 1,
      remark: dto.remark ?? '',
      createBy: operator,
      updateBy: operator,
    });

    return this.deptRepository.save(dept);
  }

  /**
   * 修改部门：支持变更父部门，重新计算祖级列表，禁止挂到自身或子孙节点下
   */
  async update(
    id: number,
    dto: UpdateDeptDto,
    operator: string,
  ): Promise<SysDept> {
    const dept = await this.getExistingDept(id);

    if (dto.parentId !== undefined && dto.parentId !== dept.parentId) {
      await this.assertParentLegal(id, dto.parentId);
    }

    if (dto.deptName !== undefined) dept.deptName = dto.deptName;
    if (dto.sortOrder !== undefined) dept.sortOrder = dto.sortOrder;
    if (dto.leader !== undefined) dept.leader = dto.leader;
    if (dto.phone !== undefined) dept.phone = dto.phone;
    if (dto.email !== undefined) dept.email = dto.email;
    if (dto.isEnabled !== undefined) dept.isEnabled = dto.isEnabled;
    if (dto.remark !== undefined) dept.remark = dto.remark;

    if (dto.parentId !== undefined) {
      dept.parentId = dto.parentId;
      dept.ancestors = await this.resolveAncestors(dto.parentId);
    }

    dept.updateBy = operator;
    return this.deptRepository.save(dept);
  }

  /**
   * 删除部门：逻辑删除(del_flag=1)，存在未删除的下级部门时禁止删除
   */
  async remove(id: number, operator: string): Promise<{ id: number }> {
    await this.getExistingDept(id);

    const childCount = await this.deptRepository.count({
      where: { parentId: id, delFlag: 0 },
    });
    if (childCount > 0) {
      throw new ConflictException('存在下级部门，无法删除');
    }

    await this.deptRepository.update(
      { id },
      { delFlag: 1, updateBy: operator },
    );
    return { id };
  }

  /** 获取未被逻辑删除的部门，不存在则抛 NotFound */
  private async getExistingDept(id: number): Promise<SysDept> {
    const dept = await this.deptRepository.findOne({
      where: { id, delFlag: 0 },
    });
    if (!dept) {
      throw new NotFoundException('部门不存在');
    }
    return dept;
  }

  /**
   * 根据父部门ID计算祖级列表：顶级为 '0'，其余为 `父.ancestors,父.id`
   */
  private async resolveAncestors(parentId: number): Promise<string> {
    if (parentId <= 0) {
      return '0';
    }
    const parent = await this.deptRepository.findOne({
      where: { id: parentId, delFlag: 0 },
    });
    if (!parent) {
      throw new NotFoundException('父部门不存在');
    }
    return `${parent.ancestors},${parent.id}`;
  }

  /** 校验变更后的父部门不能是自身或其子孙节点 */
  private async assertParentLegal(id: number, parentId: number): Promise<void> {
    if (parentId === id) {
      throw new ConflictException('父部门不能为自身');
    }
    if (parentId <= 0) {
      return;
    }
    const parent = await this.deptRepository.findOne({
      where: { id: parentId, delFlag: 0 },
    });
    if (!parent) {
      throw new NotFoundException('父部门不存在');
    }
    const ancestorIds = parent.ancestors.split(',').map(Number);
    if (ancestorIds.includes(id)) {
      throw new ConflictException('不能将部门移动到自己的下级部门');
    }
  }
}
