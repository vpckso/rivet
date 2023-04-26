import { ChartNode, NodeId, PortId } from '../NodeBase';
import { assertBaseDir } from '../native/BaseDir';
import { NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { DataValue, expectType } from '../DataValue';
import { NodeImpl, ProcessContext } from '../NodeImpl';
import { nanoid } from 'nanoid';

export type ReadDirectoryNode = ChartNode<'readDirectory', ReadDirectoryNodeData>;

type ReadDirectoryNodeData = {
  path: string;
  usePathInput: boolean;

  recursive: boolean;
  useRecursiveInput: boolean;

  includeDirectories: boolean;
  useIncludeDirectoriesInput: boolean;

  filterGlobs: string[];
  useFilterGlobsInput: boolean;

  relative: boolean;
  useRelativeInput: boolean;
};

export class ReadDirectoryNodeImpl extends NodeImpl<ReadDirectoryNode> {
  static create(): ReadDirectoryNode {
    return {
      id: nanoid() as NodeId,
      type: 'readDirectory',
      title: 'Read Directory',
      visualData: { x: 0, y: 0 },
      data: {
        path: 'examples',
        recursive: false,
        usePathInput: false,
        useRecursiveInput: false,
        includeDirectories: false,
        useIncludeDirectoriesInput: false,
        filterGlobs: [],
        useFilterGlobsInput: false,
        relative: false,
        useRelativeInput: false,
      },
    };
  }

  getInputDefinitions(): NodeInputDefinition[] {
    const inputDefinitions: NodeInputDefinition[] = [];

    if (this.chartNode.data.usePathInput) {
      inputDefinitions.push({
        id: 'path' as PortId,
        title: 'Path',
        dataType: 'string',
        required: true,
      });
    }

    if (this.chartNode.data.useRecursiveInput) {
      inputDefinitions.push({
        id: 'recursive' as PortId,
        title: 'Recursive',
        dataType: 'boolean',
        required: true,
      });
    }

    if (this.chartNode.data.useIncludeDirectoriesInput) {
      inputDefinitions.push({
        id: 'includeDirectories' as PortId,
        title: 'Include Directories',
        dataType: 'boolean',
        required: true,
      });
    }

    if (this.chartNode.data.useFilterGlobsInput) {
      inputDefinitions.push({
        id: 'filterGlobs' as PortId,
        title: 'Filter Globs',
        dataType: 'string[]',
        required: true,
      });
    }

    if (this.chartNode.data.useRelativeInput) {
      inputDefinitions.push({
        id: 'relative' as PortId,
        title: 'Relative',
        dataType: 'boolean',
        required: true,
      });
    }

    return inputDefinitions;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'paths' as PortId,
        title: 'Paths',
        dataType: 'string[]',
      },
    ];
  }

  async process(inputData: Record<PortId, DataValue>, context: ProcessContext): Promise<Record<PortId, DataValue>> {
    const path = this.chartNode.data.usePathInput
      ? expectType(inputData['path' as PortId], 'string')
      : this.chartNode.data.path;

    const recursive = this.chartNode.data.useRecursiveInput
      ? expectType(inputData['recursive' as PortId], 'boolean')
      : this.chartNode.data.recursive;

    const includeDirectories = this.chartNode.data.useIncludeDirectoriesInput
      ? expectType(inputData['includeDirectories' as PortId], 'boolean')
      : this.chartNode.data.includeDirectories;

    const filterGlobs = this.chartNode.data.useFilterGlobsInput
      ? expectType(inputData['filterGlobs' as PortId], 'string[]')
      : this.chartNode.data.filterGlobs;

    const relative = this.chartNode.data.useRelativeInput
      ? expectType(inputData['relative' as PortId], 'boolean')
      : this.chartNode.data.relative;

    const files = await context.nativeApi.readdir(path, undefined, {
      recursive,
      includeDirectories,
      filterGlobs,
      relative,
    });

    return {
      ['paths' as PortId]: { type: 'string[]', value: files },
    };
  }
}
